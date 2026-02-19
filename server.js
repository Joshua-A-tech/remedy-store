const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// M-Pesa Daraja API Credentials
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.CALLBACK_URL;

// M-Pesa Daraja API URLs
const AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

// Generate Access Token
async function getAccessToken() {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

    const response = await axios.get(AUTH_URL, {
        headers: {
            Authorization: `Basic ${auth}`
        }
    });

    return response.data.access_token;
}

// STK Push Route
app.post('/stkpush', async (req, res) => {
    try {
        const { phone, amount } = req.body;

        const token = await getAccessToken();

        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = Buffer.from(
            BUSINESS_SHORTCODE + PASSKEY + timestamp
        ).toString('base64');

        const response = await axios.post(STK_URL, {
            BusinessShortCode: BUSINESS_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: BUSINESS_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: CALLBACK_URL,
            AccountReference: "Remedy Store",
            TransactionDesc: "Payment"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "Payment request failed" });
    }
});

// Callback Route
app.post('/mpesa-callback', (req, res) => {
    console.log("M-Pesa Callback:", req.body);
    res.status(200).send("Callback received");
});

const PORT = 5000;
app.li