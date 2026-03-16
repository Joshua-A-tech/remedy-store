// =======================
// IMPORTS
// =======================
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
const path = require('path');
require('dotenv').config();

const app = express();

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// =======================
// ROOT ROUTE
// =======================
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/Index.html');
  console.log('Serving:', indexPath);

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('File error:', err);
      res.status(err.status || 500).end();
    }
  });
});

// =======================
// MPESA CONFIGURATION
// =======================
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.CALLBACK_URL;

// =======================
// DARARA API URLS
// =======================
const AUTH_URL =
  'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

const STK_URL =
  'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

const QUERY_URL =
  'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

// =======================
// MEMORY TRANSACTIONS
// =======================
const pendingTransactions = {};

// =======================
// CLEAN OLD TRANSACTIONS
// =======================
function cleanOldTransactions() {
  const now = Date.now();

  Object.keys(pendingTransactions).forEach((id) => {
    const transaction = pendingTransactions[id];
    const age = now - new Date(transaction.createdAt).getTime();

    if (age > 10 * 60 * 1000) {
      delete pendingTransactions[id];
    }
  });
}

setInterval(cleanOldTransactions, 5 * 60 * 1000);

// =======================
// GET MPESA ACCESS TOKEN
// =======================
async function getAccessToken() {
  try {
    const auth = Buffer.from(
      `${CONSUMER_KEY}:${CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(AUTH_URL, {
      headers: { Authorization: `Basic ${auth}` }
    });

    return response.data.access_token;

  } catch (error) {
    console.error('Access token error:', error.message);
    throw error;
  }
}

// =======================
// STK PUSH ROUTE
// =======================
app.post('/api/mpesa-stk-push', async (req, res) => {
  try {
    const { phoneNumber, amount, orderNumber } = req.body;

    if (!phoneNumber || !amount || !orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Format phone number
    let phone = phoneNumber.replace(/^\+/, '').replace(/^0/, '254');

    if (!phone.startsWith('254')) {
      phone = '254' + phone;
    }

    phone = phone.replace(/\D/g, '');

    // Validate phone
    if (!/^254\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    const accessToken = await getAccessToken();

    const timestamp = moment().format('YYYYMMDDHHmmss');

    const password = Buffer.from(
      `${BUSINESS_SHORTCODE}${PASSKEY}${timestamp}`
    ).toString('base64');

    const stkRequest = {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: BUSINESS_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: orderNumber,
      TransactionDesc: `Payment for order ${orderNumber}`
    };

    const response = await axios.post(STK_URL, stkRequest, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Use real CheckoutRequestID
    const checkoutRequestId = response.data.CheckoutRequestID;

    pendingTransactions[checkoutRequestId] = {
      orderNumber,
      checkoutRequestId,
      status: 'PENDING',
      createdAt: new Date()
    };

    res.json({
      success: true,
      message: 'STK Push sent successfully',
      checkoutRequestId
    });

  } catch (error) {
    console.error(
      'STK Push Error:',
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: 'Failed to send STK Push'
    });
  }
});

// =======================
// MPESA CALLBACK
// =======================
app.post('/mpesa-callback', (req, res) => {
  try {
    const result = req.body?.Body?.stkCallback;

    if (!result) {
      console.warn('Unexpected callback body:', req.body);
      return res.json({});
    }

    const checkoutRequestId = result.CheckoutRequestID;
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDesc;

    console.log('Callback:', {
      checkoutRequestId,
      resultCode,
      resultDesc
    });

    if (pendingTransactions[checkoutRequestId]) {

      if (resultCode === 0) {

        pendingTransactions[checkoutRequestId].status = 'COMPLETED';

        const metadata = result.CallbackMetadata?.Item || [];

        const receipt = metadata.find(
          (item) => item.Name === 'MpesaReceiptNumber'
        )?.Value;

        pendingTransactions[checkoutRequestId].mpesaReceiptNumber = receipt;

      } else {

        pendingTransactions[checkoutRequestId].status = 'FAILED';

      }
    }

    res.json({});

  } catch (error) {
    console.error('Callback error:', error);
    res.json({});
  }
});

// =======================
// CHECK PAYMENT STATUS
// =======================
app.post('/api/check-payment-status', async (req, res) => {
  try {

    const { checkoutRequestId } = req.body;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'CheckoutRequestID required'
      });
    }

    if (pendingTransactions[checkoutRequestId]) {
      return res.json({
        success: true,
        status: pendingTransactions[checkoutRequestId].status
      });
    }

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
      status: response.data.ResultCode === 0
        ? 'COMPLETED'
        : 'PENDING'
    });

  } catch (error) {

    console.error('Query error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });

  }
});

// =======================
// HEALTH CHECK
// =======================
app.get('/health', (req, res) => {
  res.json({
    status: 'Server running',
    time: new Date()
  });
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

if (
  process.env.LOCAL === 'true' ||
  process.env.NODE_ENV !== 'production'
) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('M-Pesa Daraja API active');
  });
}

// Export for serverless
module.exports = app;