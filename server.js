const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// M-Pesa Daraja API Credentials
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || 'fuejG7VmKqHL7s6UdevhkTNnYbotZG9Y8CNQ8pykfrVIwtxk';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'wgIKGcjloXp3IcdusasXCqnzLLWLOksP21paHJe6joyC6JZAGiKSQBGFormoD4gO
';
const BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd1a503b6055e3e7635eae304cd07f2d9d06d17e11';
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://remedy-store.vercel.app//mpesa-callback';

// M-Pesa Daraja API URLs
const AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
const QUERY_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

// Store pending transactions
const pendingTransactions = {};

// Get M-Pesa Access Token
async function getAccessToken() {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.message);
    throw error;
  }
}

// Send STK Push to M-Pesa
app.post('/api/mpesa-stk-push', async (req, res) => {
  try {
    const { phoneNumber, amount, orderNumber, customerName } = req.body;

    // Validate input
    if (!phoneNumber || !amount || !orderNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Format phone number (remove leading 0, add 254)
    let formattedPhone = phoneNumber.replace(/^0/, '254');
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone;
    } else {
      formattedPhone = '254' + formattedPhone;
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp and password
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(
      `${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`
    ).toString('base64');

    // Prepare STK Push request
    const stkRequest = {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: BUSINESS_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: orderNumber,
      TransactionDesc: `Payment for order ${orderNumber} - ${customerName}`
    };

    // Send STK Push
    const response = await axios.post(STK_URL, stkRequest, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Store transaction for tracking
    const checkoutRequestId = response.data.CheckoutRequestID;
    pendingTransactions[checkoutRequestId] = {
      orderNumber,
      phoneNumber: formattedPhone,
      amount,
      customerName,
      timestamp: new Date(),
      status: 'PENDING'
    };

    res.json({
      success: true,
      message: 'STK Push sent successfully',
      checkoutRequestId: checkoutRequestId,
      responseCode: response.data.ResponseCode
    });

  } catch (error) {
    console.error('STK Push Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.errorMessage || 'Failed to send STK Push',
      error: error.message
    });
  }
});

// M-Pesa Callback Handler
app.post('/mpesa-callback', (req, res) => {
  try {
    const { Body } = req.body;
    const result = Body.stkCallback;

    const checkoutRequestId = result.CheckoutRequestID;
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDesc;

    console.log('M-Pesa Callback:', {
      checkoutRequestId,
      resultCode,
      resultDesc
    });

    // Update transaction status
    if (pendingTransactions[checkoutRequestId]) {
      if (resultCode === 0) {
        // Payment successful
        pendingTransactions[checkoutRequestId].status = 'COMPLETED';
        const callbackMetadata = result.CallbackMetadata?.Item || [];
        const mpesaReceiptNumber = callbackMetadata.find(
          item => item.Name === 'MpesaReceiptNumber'
        )?.Value;
        pendingTransactions[checkoutRequestId].mpesaReceiptNumber = mpesaReceiptNumber;
      } else {
        // Payment failed or cancelled
        pendingTransactions[checkoutRequestId].status = 'FAILED';
      }
    }

    // Return success response to M-Pesa
    res.json({});

  } catch (error) {
    console.error('Callback Error:', error);
    res.json({});
  }
});

// Check Payment Status
app.post('/api/check-payment-status', async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;

    if (!checkoutRequestId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Checkout Request ID required' 
      });
    }

    // Check in pending transactions
    if (pendingTransactions[checkoutRequestId]) {
      return res.json({
        success: true,
        status: pendingTransactions[checkoutRequestId].status,
        transaction: pendingTransactions[checkoutRequestId]
      });
    }

    // Query M-Pesa if not in local cache
    const accessToken = await getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(
      `${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`
    ).toString('base64');

    const queryRequest = {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(QUERY_URL, queryRequest, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      status: response.data.ResultCode === 0 ? 'COMPLETED' : 'PENDING',
      response: response.data
    });

  } catch (error) {
    console.error('Query Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('M-Pesa Daraja API Integration Active');
  console.log(`\nIMPORTANT: Set your M-Pesa credentials in .env file:`);
  console.log('MPESA_CONSUMER_KEY=your_key');
  console.log('MPESA_CONSUMER_SECRET=your_secret');
  console.log('MPESA_BUSINESS_SHORTCODE=174379');
  console.log('CALLBACK_URL=your_callback_url');
});

module.exports = app;
