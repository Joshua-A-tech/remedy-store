# M-Pesa Integration Setup Guide

## Overview
This document explains how to set up **real M-Pesa payment processing** for the Remedy Store e-commerce website.

## Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- M-Pesa Daraja API account
- A public domain/URL for callback (for production)

## Step 1: Get M-Pesa Daraja API Credentials

1. Visit [M-Pesa Daraja Portal](https://developer.safaricom.co.ke)
2. Create an account or log in
3. Create a new application:
   - Name: "Remedy Store"
   - Select "STK Push"
4. You'll get:
   - **Consumer Key**
   - **Consumer Secret**
5. Also note your **Business Shortcode** (usually 174379 for sandbox, different for production)

## Step 2: Install Dependencies

```bash
# Navigate to project folder
cd webpr

# Install required packages
npm install
```

This installs:
- `express` - Web server
- `axios` - HTTP requests to M-Pesa API
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `moment` - Date/time handling

## Step 3: Configure Credentials

Edit the `.env` file and replace with your actual credentials:

```env
MPESA_CONSUMER_KEY=your_actual_consumer_key
MPESA_CONSUMER_SECRET=your_actual_consumer_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6055e3e7635eae304cd07f2d9d06d17e11
CALLBACK_URL=http://localhost:3000/mpesa-callback
PORT=3000
```

### For Production:
- Use production credentials instead of sandbox
- Set CALLBACK_URL to your public domain
- Ensure callback URL is publicly accessible and HTTPS

## Step 4: Run the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# OR standard mode
npm start
```

You should see:
```
Server running on port 3000
M-Pesa Daraja API Integration Active
```

## Step 5: Test M-Pesa Integration

1. Open the website: `http://localhost:3000`
2. Add items to cart
3. Click "Proceed to Checkout"
4. Select "📱 M-Pesa" as payment method
5. Fill checkout form and click "Place Order"
6. Enter an M-Pesa phone number (e.g., 0712345678)
7. Click "Send STK"

You'll see:
- STK prompt is sent to M-Pesa
- System polls for payment status every 2 seconds
- On your actual phone (if using real account), you'll receive an STK prompt
- Enter M-Pesa PIN on your phone
- Payment is confirmed and order is saved

## API Endpoints

### 1. Send STK Push
```
POST /api/mpesa-stk-push
Content-Type: application/json

{
  "phoneNumber": "0712345678",
  "amount": 1050,
  "orderNumber": "ORD-1234567890",
  "customerName": "John Doe"
}

Response:
{
  "success": true,
  "checkoutRequestId": "ws_CO_123456789",
  "message": "STK Push sent successfully"
}
```

### 2. Check Payment Status
```
POST /api/check-payment-status
Content-Type: application/json

{
  "checkoutRequestId": "ws_CO_123456789"
}

Response:
{
  "success": true,
  "status": "COMPLETED|PENDING|FAILED",
  "transaction": { ... }
}
```

### 3. M-Pesa Callback
```
POST /mpesa-callback
(Automatically called by M-Pesa when payment is made)
```

## How It Works

```
┌─────────────────────────────────────────────────────┐
│         User Flow: Real M-Pesa Payment             │
└─────────────────────────────────────────────────────┘

1. User selects M-Pesa payment
2. User enters phone number & clicks "Send STK"
3. Frontend → Backend: /api/mpesa-stk-push
4. Backend → M-Pesa API: STK Push Request
5. M-Pesa → User Phone: STK Popup
6. User enters PIN and confirms payment
7. M-Pesa → Backend: Callback with result
8. Backend → Frontend: Payment Status (via polling)
9. Frontend: Shows success/failure message
10. Order saved to localStorage with status
11. User redirected to orders page
```

## Testing Phone Numbers (Sandbox)

For testing with Safaricom Sandbox:
- **Phone Number**: 254712345678 or 0712345678
- **Business Short Code**: 174379
- **Default Passkey**: bfb279f9aa9bdbcf158e97dd1a503b6055e3e7635eae304cd07f2d9d06d17e11

Note: Sandbox doesn't actually debit money. Actual STK prompts appear after 3-5 seconds.

## Troubleshooting

### "Invalid Consumer Key/Secret"
- Check your .env file has correct credentials
- Ensure no extra spaces in credentials
- Verify credentials from Daraja portal

### "Invalid Business Shortcode"
- Use sandbox shortcode (174379) for testing
- Use your actual shortcode for production

### Callback Not Working
- CALLBACK_URL must be publicly accessible
- For local testing, use ngrok: `ngrok http 3000`
- Update CALLBACK_URL in .env with ngrok URL

### STK Not Appearing on Phone
- Ensure phone number is registered with M-Pesa
- Wait 3-5 seconds after sending
- Check server logs for errors

## Deployment

### To Production:

1. Get production M-Pesa credentials from Safaricom
2. Host on a server (e.g., Heroku, AWS, DigitalOcean)
3. Update .env with production credentials
4. Use HTTPS for all URLs
5. Set CALLBACK_URL to your production domain

### Example Heroku Deployment:
```bash
heroku create remedy-store
heroku config:set MPESA_CONSUMER_KEY=your_key
heroku config:set MPESA_CONSUMER_SECRET=your_secret
git push heroku main
```

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to git (add to `.gitignore`)
- Keep Consumer Key/Secret confidential
- Use HTTPS in production
- Validate all inputs on backend
- Store order records securely
- Implement proper error logging

## Support

For M-Pesa API issues:
- Visit: https://developer.safaricom.co.ke
- Check: API documentation and sandbox credentials
- Contact: M-Pesa support

---

**Status**: Ready for production after configuring with real credentials
