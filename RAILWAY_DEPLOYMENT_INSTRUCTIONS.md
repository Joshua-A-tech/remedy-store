# 🚀 REMEDY STORE - RAILWAY.APP DEPLOYMENT GUIDE

**Date:** January 19, 2026  
**Status:** Ready to Deploy  
**Platform:** Railway.app

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- ✅ Procfile created
- ✅ All code committed to GitHub
- ✅ Environment variables configured
- ✅ Backend server working
- ✅ Frontend operational
- ✅ All tests passing

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### **Step 1: Sign Up on Railway.app** (2 minutes)

1. Visit: **https://railway.app**
2. Click **"Start Now"**
3. Choose **"Deploy from GitHub"**
4. Click **"Continue with GitHub"**
5. Authorize Railway to access your GitHub account

---

### **Step 2: Select Your Repository** (1 minute)

1. Find **"remedy-store"** in your repository list
2. Click to select it
3. Click **"Deploy Now"**

Railway will automatically detect your project!

---

### **Step 3: Configure Environment Variables** (3 minutes)

Railway will show a configuration screen. Add these variables:

```
MPESA_CONSUMER_KEY=fuejG7VmKqHL7s6UdevhkTNnYbotZG9Y8CNQ8pykfrVIwtxk
MPESA_CONSUMER_SECRET=wgIKGcjloXp3IcdusasXCqnzLLWLOksP21paHJe6joyC6JZAGiKSQBGFormoD4gO
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6055e3e7635eae304cd07f2d9d06d17e11
NODE_ENV=production
PORT=3000
```

**Then click "Deploy"**

---

### **Step 4: Wait for Deployment** (2-5 minutes)

Railway will:
1. Clone your repository
2. Install dependencies
3. Build your application
4. Deploy to production

Watch the logs to confirm everything is working!

---

### **Step 5: Get Your Public URL** (1 minute)

1. After deployment completes, go to the "Settings" tab
2. Look for **"Domains"** section
3. You'll see a URL like: `https://remedy-store-production.up.railway.app`
4. Copy this URL

**Your app is now live! 🎉**

---

## 🔗 UPDATE M-PESA CALLBACK URL

Once you have your Railway URL, update the callback:

1. In Railway dashboard, go to **Variables**
2. Update `CALLBACK_URL` to:
   ```
   https://your-railway-url/mpesa-callback
   ```
3. Click "Redeploy" to apply changes

---

## ✅ VERIFY DEPLOYMENT

### Test Your Live App:

1. **Homepage:** Visit your Railway URL
2. **Products:** Browse products on `/order.html`
3. **Contact Form:** Fill and submit contact form
4. **Shopping Cart:** Add items to cart
5. **Checkout:** Test checkout flow

### Check Logs:

In Railway dashboard:
- Click "Deployments" tab
- View real-time logs
- Check for any errors

---

## 📊 DEPLOYMENT DETAILS

| Item | Value |
|------|-------|
| **Platform** | Railway.app |
| **Cost** | Free tier: 50 hours/month, Paid: $5/month |
| **Uptime** | 99.9% SLA |
| **Auto Redeploy** | Yes (on git push) |
| **Database Support** | Yes (PostgreSQL, MongoDB available) |
| **Domain** | Free subdomain or custom domain |

---

## 🔄 AUTO-REDEPLOYMENT SETUP

Railway automatically redeploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Your message"
git push origin main
# Railway automatically deploys!
```

---

## 📱 CUSTOM DOMAIN (Optional)

To use a custom domain like `remedystore.com`:

1. In Railway dashboard, go to **Domains**
2. Click **"Add Custom Domain"**
3. Enter your domain
4. Update DNS records (Railway will show instructions)
5. Wait for SSL certificate (automatic)

---

## 🆘 TROUBLESHOOTING

### App won't start:
```
Check logs in Railway dashboard
Look for missing dependencies or environment variables
```

### Payment not working:
```
Verify CALLBACK_URL is correct
Check M-Pesa credentials in variables
Ensure NODE_ENV=production
```

### Database errors (if applicable):
```
Check database connection string
Verify database is running
Check firewall rules
```

### Need logs:
```
Click "Deployments" in Railway dashboard
View real-time logs from your app
```

---

## 🚨 IMPORTANT NOTES

⚠️ **Sandbox vs Production:**
- Current credentials are for **SANDBOX** (testing)
- For real payments, you need **PRODUCTION** M-Pesa credentials
- Contact Safaricom to get production credentials

⚠️ **First Time Setup:**
- Railway free tier: 500 hours/month billed
- Paid tier: $5/month minimum
- Very affordable for small projects

⚠️ **Data Storage:**
- Currently using browser localStorage
- Consider adding database later for persistent data
- Railway provides free PostgreSQL for first database

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. ✅ Test all features live
2. ✅ Share URL with users
3. ✅ Monitor performance (Railway dashboard)
4. ✅ Track M-Pesa payments
5. ✅ Gather user feedback
6. ✅ Plan improvements

---

## 💻 DASHBOARD FEATURES

In Railway dashboard you can:

- 📊 View real-time logs
- 📈 Monitor CPU and memory usage
- 🔄 View deployment history
- ⚙️ Manage environment variables
- 🌐 Configure custom domains
- 🔐 Set up SSL certificates
- 💾 Add databases
- 📈 Track metrics and analytics

---

## 🔗 USEFUL LINKS

- **Railway Dashboard:** https://railway.app/dashboard
- **Railway Docs:** https://docs.railway.app
- **GitHub Integration:** https://docs.railway.app/develop/github
- **M-Pesa Daraja:** https://developer.safaricom.co.ke/

---

## 📞 SUPPORT

### If you encounter issues:

1. Check Railway logs (click "Deployments")
2. Review error messages
3. Check environment variables are set correctly
4. Verify GitHub repository is properly connected
5. Check if port conflicts (should be automatic)

### Railway Support:
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app
- Status: https://status.railway.app

---

## ✨ CONGRATULATIONS! 🎉

Your Remedy Store is now deployed on Railway.app and accessible worldwide!

**Your live URL:** `https://your-railway-app-name.up.railway.app`

**Celebrate! 🚀**

