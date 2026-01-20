const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Root route - serve Index.html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/Index.html');
  console.log('Attempting to serve:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).end();
    }
  });
});

// M-Pesa Daraja API Credentials
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://remedy-store.vercel.app/mpesa-callback';

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
      headers: { Authorization: `Basic ${auth}` }
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

    if (!phoneNumber || !amount || !orderNumber) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let formattedPhone = phoneNumber.replace(/^\+/, '').replace(/^0/, '254');
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;
    formattedPhone = formattedPhone.replace(/\D/g, '');
    if (formattedPhone.length < 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Use format: 0712345678 or +254712345678'
      });
    }

    const accessToken = await getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

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

    const response = await axios.post(STK_URL, stkRequest, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });

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
      checkoutRequestId,
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

    if (pendingTransactions[checkoutRequestId]) {
      pendingTransactions[checkoutRequestId].status = resultCode === 0 ? 'COMPLETED' : 'FAILED';
      if (resultCode === 0) {
        const callbackMetadata = result.CallbackMetadata?.Item || [];
        const mpesaReceiptNumber = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        pendingTransactions[checkoutRequestId].mpesaReceiptNumber = mpesaReceiptNumber;
      }
    }

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
      return res.status(400).json({ success: false, message: 'Checkout Request ID required' });
    }

    if (pendingTransactions[checkoutRequestId]) {
      return res.json({
        success: true,
        status: pendingTransactions[checkoutRequestId].status,
        transaction: pendingTransactions[checkoutRequestId]
      });
    }

    const accessToken = await getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const queryRequest = {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(QUERY_URL, queryRequest, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });

    res.json({
      success: true,
      status: response.data.ResultCode === 0 ? 'COMPLETED' : 'PENDING',
      response: response.data
    });

  } catch (error) {
    console.error('Query Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to check payment status', error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date() });
});

// Export app for Vercel
module.exports = app;
;
