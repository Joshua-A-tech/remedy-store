const express = require('express');
const axios = require('axios');
const cors = require('cors');
const moment = require('moment');
const path = require('path');
require('dotenv').config();

const app = express();

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json()); // Native Express body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// =======================
// CONFIG & CONSTANTS
// =======================
const {
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_PASSKEY,
    MPESA_BUSINESS_SHORTCODE = '174379',
    CALLBACK_URL,
    NODE_ENV = 'development'
} = process.env;

// Use Sandbox URL if not in production
const BASE_URL = NODE_ENV === 'production' 
    ? 'https://safaricom.co.ke' 
    : 'https://safaricom.co.ke';

const pendingTransactions = new Map(); // Using Map for better performance than {}

// =======================
// UTILITIES
// =======================

// Cleanup: Removes transactions older than 15 mins
setInterval(() => {
    const now = Date.now();
    for (const [id, tx] of pendingTransactions) {
        if (now - tx.createdAt > 15 * 60 * 1000) pendingTransactions.delete(id);
    }
}, 5 * 60 * 1000);

async function getAccessToken() {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    try {
        const { data } = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { Authorization: `Basic ${auth}` }
        });
        return data.access_token;
    } catch (error) {
        console.error('M-Pesa Auth Error:', error.response?.data || error.message);
        throw new Error('Authentication with Safaricom failed');
    }
}

// =======================
// ROUTES
// =======================

app.post('/api/mpesa-stk-push', async (req, res) => {
    try {
        let { phoneNumber, amount, orderNumber } = req.body;

        // 1. Better Phone Sanitization
        let phone = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
        if (phone.startsWith('0')) phone = '254' + phone.slice(1);
        if (phone.startsWith('7') || phone.startsWith('1')) phone = '254' + phone;

        if (!/^254(7|1)\d{8}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'Invalid Safaricom number' });
        }

        const token = await getAccessToken();
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = Buffer.from(`${MPESA_BUSINESS_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

        const { data } = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
            BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: phone,
            PartyB: MPESA_BUSINESS_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: CALLBACK_URL,
            AccountReference: `Order-${orderNumber}`,
            TransactionDesc: `Pay for ${orderNumber}`
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        pendingTransactions.set(data.CheckoutRequestID, {
            orderNumber,
            status: 'PENDING',
            createdAt: Date.now()
        });

        res.json({ success: true, checkoutRequestId: data.CheckoutRequestID });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/mpesa-callback', (req, res) => {
    const { Body: { stkCallback } } = req.body;
    
    console.log(`Callback received for ID: ${stkCallback.CheckoutRequestID}`);

    if (pendingTransactions.has(stkCallback.CheckoutRequestID)) {
        const tx = pendingTransactions.get(stkCallback.CheckoutRequestID);
        
        if (stkCallback.ResultCode === 0) {
            tx.status = 'COMPLETED';
            tx.receipt = stkCallback.CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
        } else {
            tx.status = 'FAILED';
        }
    }
    
    // Always acknowledge Safaricom with 200 OK
    res.status(200).send('Success');
});

app.get('/api/check-status/:id', (req, res) => {
    const tx = pendingTransactions.get(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction expired or not found' });
    res.json({ success: true, status: tx.status, receipt: tx.receipt || null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Live on port ${PORT}`));
