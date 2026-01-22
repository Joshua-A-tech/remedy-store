const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// NOTE: Do NOT keep real credentials in code. Set these in backend/.env or in your deployment environment.
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.CALLBACK_URL; // must be https in production

if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY || !CALLBACK_URL) {
  console.error('Missing required MPESA configuration. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, CALLBACK_URL in .env');
  process.exit(1);
}

// Daraja endpoints (sandbox - switch to production URLs in production)
const AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
const QUERY_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';

// In-memory store for pending transactions (for demo). Replace with DB in production.
const pendingTransactions = {};

// Helper: normalize phone numbers into 2547XXXXXXXX format
function formatPhoneNumber(input) {
  if (!input) return '';  
  // Remove non-digits
  let digits = input.replace(/\D/g, '');
  // If starts with 0 -> replace with 254
  if (digits.length === 9 && digits.startsWith('7')) {
    // e.g., 712345678 => 254712345678
    return '254' + digits;
  }
  if (digits.length === 10 && digits.startsWith('0')) {
    return '254' + digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith('254')) {
    return digits;
  }
  if (digits.length === 13 && digits.startsWith('0254')) {
    return digits.slice(1);
  }
  // If input had +254...
  if (input.startsWith('+') && digits.length === 12) {
    return digits;
  }
  // Fallback: return digits unchanged
  return digits;
}

// Get M-Pesa Access Token
async function getAccessToken() {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Build password for STK (BusinessShortCode + Passkey + Timestamp) base64
function buildSTKPassword(businessShortCode, passkey, timestamp) {
  return Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');
}

// Send STK Push
app.post('/api/mpesa-stk-push', async (req, res) => {
  try {
    const { phoneNumber, amount, orderNumber, customerName } = req.body;

    if (!phoneNumber || !amount || !orderNumber) {
      return res.status(400).json({ success: false, message: 'Missing required fields: phoneNumber, amount, orderNumber' });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || !formattedPhone.startsWith('254')) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format. Use Kenyan numbers (07XXXXXXXX or +2547XXXXXXXX).' });
    }

    const accessToken = await getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = buildSTKPassword(BUSINESS_SHORTCODE, PASSKEY, timestamp);

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
      TransactionDesc: `Payment for order ${orderNumber} - ${customerName || 'Customer'}`
    };

    const response = await axios.post(STK_URL, stkRequest, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Daraja returns CheckoutRequestID inside response.data
    const checkoutRequestId = response.data && (response.data.CheckoutRequestID || response.data.checkoutRequestId) || `CR${Date.now()}`;

    pendingTransactions[checkoutRequestId] = {
      status: 'PENDING',
      phone: formattedPhone,
      amount,
      orderNumber,
      createdAt: new Date().toISOString()
    }; 

    return res.json({
      success: true,
      message: 'STK Push initiated',
      checkoutRequestId,
      raw: response.data
    });
  } catch (error) {
    console.error('Error in /api/mpesa-stk-push:', error.response ? error.response.data : error.message);
    const message = (error.response && (error.response.data && (error.response.data.errorMessage || error.response.data.error)) ) || error.message;
    return res.status(500).json({ success: false, message: 'Failed to initiate STK Push', error: message });
  }
});

// Endpoint M-Pesa will call with transaction result
app.post('/mpesa-callback', async (req, res) => {
  try {
    const body = req.body;
    console.log('Received MPESA callback:', JSON.stringify(body, null, 2));

    // Respond early to acknowledge receipt
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    // Parse callback
    const stkCallback = body && (body.Body && (body.Body.stkCallback || body.Body.StkCallback)) || null;
    if (!stkCallback) {
      console.warn('mpesa-callback: no Body.stkCallback found');
      return;
    }

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID || stkCallback.CheckoutRequestId;

    if (!checkoutRequestId) {
      console.warn('mpesa-callback: no CheckoutRequestID in callback');
      return;
    }

    if (!pendingTransactions[checkoutRequestId]) {
      pendingTransactions[checkoutRequestId] = { createdAt: new Date().toISOString() };
    }

    if (resultCode === 0) {
      const items = (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) || [];
      const meta = {};
      items.forEach(i => {
        if (i.Name) meta[i.Name] = i.Value;
      });
      pendingTransactions[checkoutRequestId].status = 'COMPLETED';
      pendingTransactions[checkoutRequestId].transaction = meta;
    } else {
      pendingTransactions[checkoutRequestId].status = 'FAILED';
      pendingTransactions[checkoutRequestId].resultCode = resultCode;
      pendingTransactions[checkoutRequestId].resultDesc = stkCallback.ResultDesc || stkCallback.ResultDesc;
    }

    console.log('Updated pendingTransactions:', checkoutRequestId, pendingTransactions[checkoutRequestId]);
  } catch (err) {
    console.error('Error processing mpesa-callback:', err.message);
  }
});

// Query payment status by CheckoutRequestID
app.post('/api/check-payment-status', async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;
    if (!checkoutRequestId) return res.status(400).json({ success: false, message: 'Missing checkoutRequestId' });

    if (pendingTransactions[checkoutRequestId] && pendingTransactions[checkoutRequestId].status !== 'PENDING') {
      return res.json({ success: true, status: pendingTransactions[checkoutRequestId].status, transaction: pendingTransactions[checkoutRequestId].transaction || null });
    }

    const accessToken = await getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = buildSTKPassword(BUSINESS_SHORTCODE, PASSKEY, timestamp);

    const queryPayload = {
      BusinessShortCode: BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(QUERY_URL, queryPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return res.json({ success: true, raw: response.data });
  } catch (error) {
    console.error('Error in /api/check-payment-status:', error.response ? error.response.data : error.message);
    return res.status(500).json({ success: false, message: 'Failed to check payment status', error: error.message });
  }
});

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app;