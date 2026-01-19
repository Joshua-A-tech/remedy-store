# 🚀 REMEDY STORE - VERCEL DEPLOYMENT GUIDE

**Date:** January 19, 2026  
**Platform:** Vercel (Free Forever!)  
**Deployment Time:** 5 minutes

---

## ✅ WHY VERCEL?

- ✅ **Free Forever** - No credit card needed
- ✅ **Super Fast** - CDN optimized
- ✅ **Auto Redeploy** - Push to GitHub = automatic deploy
- ✅ **SSL Included** - HTTPS by default
- ✅ **Global** - Served worldwide
- ✅ **Easy** - One-click deployment

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### **Step 1: Go to Vercel** (1 minute)

Visit: **https://vercel.com**

Click: **"Sign Up"** → **"Continue with GitHub"**

Authorize Vercel to access your GitHub

---

### **Step 2: Import Your Repository** (1 minute)

1. After signing in, click **"Add New..."** → **"Project"**
2. Select your GitHub account
3. Find and click **"remedy-store"**
4. Click **"Import"**

---

### **Step 3: Configure Environment Variables** (2 minutes)

Before clicking "Deploy", Vercel will ask for environment variables.

Add these variables:

```
MPESA_CONSUMER_KEY
value: fuejG7VmKqHL7s6UdevhkTNnYbotZG9Y8CNQ8pykfrVIwtxk

MPESA_CONSUMER_SECRET
value: wgIKGcjloXp3IcdusasXCqnzLLWLOksP21paHJe6joyC6JZAGiKSQBGFormoD4gO

MPESA_BUSINESS_SHORTCODE
value: 174379

MPESA_PASSKEY
value: bfb279f9aa9bdbcf158e97dd1a503b6055e3e7635eae304cd07f2d9d06d17e11

NODE_ENV
value: production

CALLBACK_URL
value: https://your-vercel-domain.vercel.app/mpesa-callback
```

Then click **"Deploy"**

---

### **Step 4: Wait for Deployment** (1-2 minutes)

Vercel will:
1. Clone your repo
2. Install dependencies
3. Build your app
4. Deploy to production

Watch the progress bar!

---

### **Step 5: Get Your URL** (Instant)

Once deployed, you'll see your public URL:

```
https://remedy-store-xxxxx.vercel.app/
```

**Your app is live!** 🎉

---

## ✅ VERIFY YOUR DEPLOYMENT

Test your live app:

1. Visit your Vercel URL
2. Click through pages
3. Add items to cart
4. Test contact form
5. Check checkout

Everything should work! ✅

---

## 🔄 UPDATE CALLBACK URL

After you get your Vercel URL:

1. Go to Vercel dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Update `CALLBACK_URL` to:
   ```
   https://your-vercel-domain.vercel.app/mpesa-callback
   ```
5. Click **Save**
6. Go to **Deployments** → **Redeploy** latest

---

## 🎯 AUTO-REDEPLOY FEATURE

Every time you push to GitHub:

```bash
git add .
git commit -m "Your message"
git push origin main
# Vercel automatically deploys! ✅
```

---

## 📊 DEPLOYMENT COMPARISON

| Feature | Vercel | Railway |
|---------|--------|---------|
| **Cost** | Free | $5/month |
| **Speed** | ⚡ Fastest | Fast |
| **Setup** | 1-click | 1-click |
| **Redeploy** | Auto | Auto |
| **Uptime** | 99.9% | 99.9% |

---

## 🆘 TROUBLESHOOTING

### App shows error:
- Check Vercel logs (Deployments tab)
- Verify environment variables are set
- Check GitHub is up to date

### M-Pesa not working:
- Make sure CALLBACK_URL is updated
- Check all M-Pesa credentials are correct
- Verify callback endpoint is `/mpesa-callback`

### Need to check logs:
- Vercel dashboard → Your project
- Click "Deployments" → Select latest
- View logs in real-time

---

## 🔗 USEFUL LINKS

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Project:** https://vercel.com/dashboard/projects
- **Documentation:** https://vercel.com/docs

---

## 💡 NEXT STEPS

1. ✅ Deploy to Vercel (follow steps above)
2. ✅ Test all features
3. ✅ Share your URL
4. ✅ Update M-Pesa callback
5. ✅ Monitor performance

---

## 🎉 READY?

**Go to https://vercel.com and follow the steps above!**

Your Remedy Store will be live in 5 minutes - totally free! 🚀

