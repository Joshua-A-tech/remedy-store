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

// Load M-Pesa credentials from environment - do NOT include hard-coded secrets here
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const BUSINESS_SHORTCODE = process.env.MPESA_BUSINESS_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://remedy-store.vercel.app/mpesa-callback';

if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY || !CALLBACK_URL) {
  console.error('MPESA configuration missing. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, CALLBACK_URL in environment or backend/.env');
  process.exit(1);
}

module.exports = app;