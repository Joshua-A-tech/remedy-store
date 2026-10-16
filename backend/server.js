const express = require('express');
const axios = require('axios');
const cors = require('cors');
const moment = require('moment');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./services/db');
const smsService = require('./services/sms');

const app = express();

// =======================
// SECURITY MIDDLEWARE
// =======================
app.use(helmet({
    contentSecurityPolicy: false // Allow CDN assets (Bootstrap, Google Fonts, Unsplash)
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter for M-Pesa STK push (prevents automated carrier spam)
const mpesaLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 6, // max 6 STK pushes per 2 minutes per IP
    message: { success: false, message: 'Too many M-Pesa payment requests. Please wait a moment before trying again.' },
    standardHeaders: true,
    legacyHeaders: false
});

// General API limiter
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', apiLimiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// =======================
// CONFIG & CONSTANTS
// =======================
const {
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_PASSKEY,
    MPESA_BUSINESS_SHORTCODE = '174379',
    CALLBACK_URL = 'http://localhost:3000/mpesa-callback',
    NODE_ENV = 'development',
    PORT = 3000,
    ADMIN_PASSCODE = 'remedy2026'
} = process.env;

const BASE_URL = NODE_ENV === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';

const pendingTransactions = new Map();

function hasRealCredentials() {
    return MPESA_CONSUMER_KEY && 
           MPESA_CONSUMER_SECRET && 
           MPESA_PASSKEY &&
           !MPESA_CONSUMER_KEY.includes('your_') &&
           !MPESA_CONSUMER_SECRET.includes('your_') &&
           !MPESA_PASSKEY.includes('your_');
}

// Cleanup pending in-memory cache every 15 minutes
setInterval(() => {
    const now = Date.now();
    for (const [id, tx] of pendingTransactions) {
        if (now - tx.createdAt > 15 * 60 * 1000) {
            pendingTransactions.delete(id);
        }
    }
}, 5 * 60 * 1000);

// Generate Safaricom Access Token
async function getAccessToken() {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    try {
        const { data } = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: { Authorization: `Basic ${auth}` },
            timeout: 10000
        });
        return data.access_token;
    } catch (error) {
        console.error('M-Pesa Auth Error:', error.response?.data || error.message);
        throw new Error('Authentication with Safaricom Daraja API failed');
    }
}

// Safaricom Daraja STK Push Query API (Active fallback verification)
async function queryDarajaStatus(checkoutRequestId) {
    if (!hasRealCredentials()) return null;
    try {
        const token = await getAccessToken();
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = Buffer.from(`${MPESA_BUSINESS_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

        const { data } = await axios.post(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
            BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId
        }, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000
        });
        return data;
    } catch (err) {
        return null;
    }
}

// =======================
// PRODUCT CATALOG WITH BUNDLES
// =======================
const products = [
    // 3 High-Value Synergistic Bundles
    {
        id: "immunity-bundle",
        name: "Immunity & Vitality Trio Bundle",
        category: "Synergistic Bundles",
        badge: "Save KES 300",
        price: 2600,
        originalPrice: 2900,
        rating: 5.0,
        reviewsCount: 92,
        inStock: true,
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        benefits: "Our flagship healing trio: Pure Wild Raw Honey, Organic Moringa Powder, and Stone-Ground Cayenne. Maximizes cellular energy and viral immunity.",
        usage: "Combine 1 tbsp Honey + 1 tsp Moringa + 1/4 tsp Cayenne in warm water with lemon daily.",
        ingredients: "Pure Forest Honey (500g) + Moringa Leaf Powder (250g) + Cayenne Pepper (100g)"
    },
    {
        id: "gut-bundle",
        name: "Gut Healing & Acid Reflux Kit",
        category: "Synergistic Bundles",
        badge: "Save KES 250",
        price: 1550,
        originalPrice: 1800,
        rating: 4.9,
        reviewsCount: 64,
        inStock: true,
        image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80",
        benefits: "Soothes acid reflux, seals irritated gut lining, and detoxifies the intestinal tract with Slippery Elm, Curcumin, and Coconut Charcoal.",
        usage: "Drink Slippery Elm before meals; take charcoal on empty stomach; enjoy golden turmeric at night.",
        ingredients: "Slippery Elm Powder + Golden Turmeric Curcumin + Steam Activated Charcoal"
    },
    {
        id: "radiance-bundle",
        name: "Hair Growth & Skin Radiance Pack",
        category: "Synergistic Bundles",
        badge: "Save KES 400",
        price: 2000,
        originalPrice: 2400,
        rating: 4.9,
        reviewsCount: 78,
        inStock: true,
        image: "https://images.unsplash.com/photo-1510443310065-27f12440ea29?auto=format&fit=crop&w=600&q=80",
        benefits: "Stimulates thick hair follicle growth, eliminates dandruff, and nourishes skin from inside out with cold-pressed Castor Oil & Omega-3 Chia.",
        usage: "Massage warm castor oil into scalp 2x weekly. Soak chia seeds in daily smoothies.",
        ingredients: "Cold-Pressed Castor Oil (500ml) + Raw Organic Chia Seeds (500g)"
    },
    // Single Remedies
    {
        id: "cayenne-pepper",
        name: "Cayenne Pepper",
        category: "Powders & Spices",
        badge: "Bestseller",
        price: 200,
        originalPrice: 250,
        rating: 4.9,
        reviewsCount: 38,
        inStock: true,
        image: "https://ke.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/74/9156623/1.jpg?1408",
        benefits: "Rich in capsaicin which boosts metabolism, reduces inflammation, improves blood circulation, and supports heart health.",
        usage: "Add 1/4 teaspoon to warm water with lemon, smoothies, or culinary dishes. Take daily.",
        ingredients: "100% Pure Organic Dried Cayenne Pepper (Capsicum annuum)"
    },
    {
        id: "castor-oil",
        name: "Cold-Pressed Castor Oil",
        category: "Oils & Elixirs",
        badge: "Popular",
        price: 800,
        originalPrice: 950,
        rating: 4.8,
        reviewsCount: 52,
        inStock: true,
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSL27kXn1xMEkAvLbVfZVia3XJrmG2zTKyCQQ&s",
        benefits: "Promotes thicker hair and lash growth, deeply moisturizes dry skin, relieves joint stiffness, and eases digestion.",
        usage: "Massage into scalp and hair roots twice weekly, or apply warm oil compress to joints/abdomen.",
        ingredients: "100% Pure Hexane-Free Cold-Pressed Ricinus Communis Seed Oil"
    },
    {
        id: "raw-honey",
        name: "Pure Wild Raw Honey",
        category: "Raw Superfoods",
        badge: "100% Organic",
        price: 1200,
        originalPrice: 1400,
        rating: 5.0,
        reviewsCount: 84,
        inStock: true,
        image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
        benefits: "Unpasteurized and enzyme-rich. Strengthens the immune system, soothes sore throats, promotes wound healing, and provides sustained natural energy.",
        usage: "Take 1-2 tablespoons daily directly, or stir into herbal tea or morning oats.",
        ingredients: "Raw, unfiltered African forest honey with natural pollen & propolis"
    },
    {
        id: "hibiscus-flowers",
        name: "Dried Hibiscus Flowers",
        category: "Herbal Teas",
        badge: "Heart Health",
        price: 900,
        originalPrice: 1100,
        rating: 4.7,
        reviewsCount: 29,
        inStock: true,
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
        benefits: "Naturally rich in anthocyanins and Vitamin C. Clinically shown to support healthy blood pressure, liver wellness, and metabolic balance.",
        usage: "Steep 1 tablespoon in hot water for 5-8 minutes. Delicious both hot or chilled as refreshing Zobo tea.",
        ingredients: "Whole dried Hibiscus sabdariffa calyces"
    },
    {
        id: "moringa-powder",
        name: "Organic Moringa Leaf Powder",
        category: "Powders & Spices",
        badge: "Miracle Superfood",
        price: 1500,
        originalPrice: 1800,
        rating: 4.9,
        reviewsCount: 67,
        inStock: true,
        image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80",
        benefits: "Known as the 'Miracle Tree'. Packed with 7x the Vitamin C of oranges and 4x the calcium of milk. Enhances vital energy and cellular renewal.",
        usage: "Mix 1 teaspoon daily into green smoothies, fresh juices, warm porridge, or soups.",
        ingredients: "100% Shade-Dried Moringa Oleifera Leaves, gently stone-ground"
    },
    {
        id: "slippery-elm",
        name: "Slippery Elm Bark Powder",
        category: "Powders & Spices",
        badge: "Gut Health",
        price: 1400,
        originalPrice: 1650,
        rating: 4.8,
        reviewsCount: 31,
        inStock: true,
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        benefits: "Creates a gentle mucilaginous coating that soothes acid reflux, gastritis, IBS, ulcerative discomfort, and inflamed vocal cords.",
        usage: "Whisk 1 teaspoon in 250ml warm water or plant milk. Drink 20 minutes before meals.",
        ingredients: "Inner bark of Ulmus rubra (Slippery Elm)"
    },
    {
        id: "turmeric-powder",
        name: "Golden Turmeric Curcumin",
        category: "Powders & Spices",
        badge: "Anti-Inflammatory",
        price: 200,
        originalPrice: 250,
        rating: 4.9,
        reviewsCount: 44,
        inStock: true,
        image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80",
        benefits: "High-potency curcumin fights systemic inflammation, relieves joint ache, sharpens cognitive focus, and aids hepatic detoxification.",
        usage: "Blend into golden milk with coconut oil and a pinch of black pepper for maximum bioavailability.",
        ingredients: "Organic Curcuma longa root powder with 5%+ active curcuminoids"
    },
    {
        id: "activated-charcoal",
        name: "Activated Coconut Charcoal",
        category: "Powders & Spices",
        badge: "Total Detox",
        price: 200,
        originalPrice: 260,
        rating: 4.6,
        reviewsCount: 22,
        inStock: true,
        image: "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=600&q=80",
        benefits: "Ultra-fine steam-activated micropores capture bodily toxins, eliminate intestinal gas, alleviate bloating, and brighten teeth naturally.",
        usage: "Take 1/2 teaspoon in water on an empty stomach, or mix with clay for a purifying face mask.",
        ingredients: "Food-grade steam-activated coconut shell carbon"
    },
    {
        id: "ashwagandha-root",
        name: "KSM-66 Ashwagandha Powder",
        category: "Powders & Spices",
        badge: "Stress & Sleep",
        price: 200,
        originalPrice: 250,
        rating: 4.9,
        reviewsCount: 58,
        inStock: true,
        image: "https://images.unsplash.com/photo-1598449356475-b9f71db7d847?auto=format&fit=crop&w=600&q=80",
        benefits: "Revered adaptogen that balances cortisol, calms chronic stress and nervous tension, enhances deep restorative sleep, and optimizes stamina.",
        usage: "Stir 1/2 teaspoon into warm milk with honey before bedtime, or into morning coffee.",
        ingredients: "Full-spectrum Withania somnifera root extract"
    },
    {
        id: "flax-seeds",
        name: "Golden Flax Seeds",
        category: "Seeds & Superfoods",
        badge: "Omega-3 Rich",
        price: 300,
        originalPrice: 380,
        rating: 4.7,
        reviewsCount: 35,
        inStock: true,
        image: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=600&q=80",
        benefits: "Abundant in plant-based Omega-3 ALA, dietary fiber, and lignans. Supports heart vitality, hormonal equilibrium, and bowel regularity.",
        usage: "Grind fresh and sprinkle over yogurt, chia bowls, salads, or bake into wholesome breads.",
        ingredients: "100% Raw Unroasted Golden Flax Seeds (Linum usitatissimum)"
    },
    {
        id: "chia-seeds",
        name: "Raw Organic Chia Seeds",
        category: "Seeds & Superfoods",
        badge: "High Fiber",
        price: 1600,
        originalPrice: 1900,
        rating: 4.8,
        reviewsCount: 47,
        inStock: true,
        image: "https://images.unsplash.com/photo-1510443310065-27f12440ea29?auto=format&fit=crop&w=600&q=80",
        benefits: "Hydration champions forming a nutrient gel that delivers steady sustained energy, healthy digestion, and essential minerals.",
        usage: "Soak 2 tablespoons in almond milk for 20 mins to create creamy pudding, or mix into fruit smoothies.",
        ingredients: "Organic Black & White Chia Seeds (Salvia hispanica)"
    },
    {
        id: "stinging-nettle",
        name: "Wild Stinging Nettle Leaf",
        category: "Herbal Teas",
        badge: "Mineral Rich",
        price: 300,
        originalPrice: 380,
        rating: 4.8,
        reviewsCount: 30,
        inStock: true,
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
        benefits: "Naturally high in iron, silica, and calcium. Relieves seasonal allergies, cleanses the kidneys, and nourishes hair and nails.",
        usage: "Steep 1-2 teaspoons in freshly boiled water for 10 minutes. Drink 1-2 cups daily.",
        ingredients: "Wildcrafted dried Stinging Nettle leaves (Urtica dioica)"
    }
];

// =======================
// ROUTES
// =======================

// 1. Products API with Live Stock Overlay
app.get('/api/products', (req, res) => {
    const inventory = db.getInventory();
    const productsWithStock = products.map(p => {
        const inv = inventory[p.id] || { stock: 20, lowStockThreshold: 5 };
        return {
            ...p,
            stock: inv.stock,
            isLowStock: inv.stock <= inv.lowStockThreshold,
            inStock: inv.stock > 0
        };
    });
    res.json({ success: true, count: productsWithStock.length, products: productsWithStock });
});

// 2. Health & Gateway Diagnostics
app.get(['/health', '/api/health'], (req, res) => {
    res.json({
        success: true,
        status: 'online',
        service: 'Remedy Store E-Commerce Gateway',
        environment: NODE_ENV,
        mpesaMode: hasRealCredentials() ? 'LIVE_DARAJA' : 'DEMO_SIMULATION',
        timestamp: new Date().toISOString()
    });
});

// 3. Initiate M-Pesa STK Push (Rate limited)
app.post('/api/mpesa-stk-push', mpesaLimiter, async (req, res) => {
    try {
        let { phoneNumber, amount, orderNumber, customerName } = req.body;

        if (!phoneNumber || !amount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number and amount are required' 
            });
        }

        let phone = String(phoneNumber).replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '254' + phone.slice(1);
        if (phone.startsWith('7') || phone.startsWith('1')) phone = '254' + phone;

        if (!/^254(7|1)\d{8}$/.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid Kenyan Safaricom phone number format. Must start with 07, 01, or 254.' 
            });
        }

        const safeOrderNumber = orderNumber || `ORD-${Date.now()}`;
        const roundedAmount = Math.max(1, Math.round(Number(amount)));

        // Live Daraja Gateway
        if (hasRealCredentials()) {
            const token = await getAccessToken();
            const timestamp = moment().format('YYYYMMDDHHmmss');
            const password = Buffer.from(`${MPESA_BUSINESS_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

            const { data } = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
                BusinessShortCode: MPESA_BUSINESS_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: roundedAmount,
                PartyA: phone,
                PartyB: MPESA_BUSINESS_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: CALLBACK_URL,
                AccountReference: safeOrderNumber,
                TransactionDesc: `Pay for ${safeOrderNumber}`
            }, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000
            });

            pendingTransactions.set(data.CheckoutRequestID, {
                orderNumber: safeOrderNumber,
                phone,
                amount: roundedAmount,
                status: 'PENDING',
                createdAt: Date.now()
            });

            return res.json({ 
                success: true, 
                checkoutRequestId: data.CheckoutRequestID,
                message: 'STK push prompt sent to your phone. Please enter your M-Pesa PIN.'
            });
        }

        // DEV / DEMO SIMULATION MODE
        const simulatedCheckoutId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        
        pendingTransactions.set(simulatedCheckoutId, {
            orderNumber: safeOrderNumber,
            phone,
            amount: roundedAmount,
            status: 'PENDING',
            createdAt: Date.now()
        });

        // Automatically simulate customer approving prompt with PIN after 4 seconds
        setTimeout(() => {
            if (pendingTransactions.has(simulatedCheckoutId)) {
                const tx = pendingTransactions.get(simulatedCheckoutId);
                tx.status = 'COMPLETED';
                tx.receipt = `QA${Math.floor(10000000 + Math.random() * 90000000)}KES`;
                console.log(`[Demo M-Pesa] Payment approved for ${safeOrderNumber}, receipt: ${tx.receipt}`);
            }
        }, 4000);

        return res.json({
            success: true,
            checkoutRequestId: simulatedCheckoutId,
            demoMode: true,
            message: 'STK prompt simulated! PIN prompt sent to ' + phone
        });

    } catch (error) {
        console.error('STK Push Error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.errorMessage || error.message || 'Payment request failed' 
        });
    }
});

// 4. M-Pesa Webhook Callback
app.post('/mpesa-callback', (req, res) => {
    try {
        const stkCallback = req.body?.Body?.stkCallback;
        if (stkCallback) {
            const checkoutId = stkCallback.CheckoutRequestID;
            console.log(`[M-Pesa Callback] ID: ${checkoutId}, ResultCode: ${stkCallback.ResultCode}`);

            if (pendingTransactions.has(checkoutId)) {
                const tx = pendingTransactions.get(checkoutId);
                if (stkCallback.ResultCode === 0) {
                    tx.status = 'COMPLETED';
                    const items = stkCallback.CallbackMetadata?.Item || [];
                    tx.receipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value || 'CONFIRMED';

                    // Update in persistent database if order exists
                    if (tx.orderNumber) {
                        db.updateOrderStatus(tx.orderNumber, 'CONFIRMED', { receipt: tx.receipt });
                    }
                } else {
                    tx.status = 'FAILED';
                    tx.failureReason = stkCallback.ResultDesc || 'User cancelled or failed';
                }
            }
        }
    } catch (err) {
        console.error('Callback parsing error:', err.message);
    }
    res.status(200).send('Success');
});

// 5. Payment status checking (With Daraja Query Fallback)
async function handleStatusCheck(id, res) {
    if (!id) {
        return res.status(400).json({ success: false, message: 'Transaction ID is required' });
    }
    const tx = pendingTransactions.get(id);
    if (!tx) {
        return res.status(404).json({ success: false, message: 'Transaction expired or not found' });
    }

    // Active Daraja Query fallback if transaction is still PENDING after 8s
    if (tx.status === 'PENDING' && (Date.now() - tx.createdAt > 8000) && hasRealCredentials()) {
        const queryRes = await queryDarajaStatus(id);
        if (queryRes) {
            if (queryRes.ResultCode === '0' || queryRes.ResultCode === 0) {
                tx.status = 'COMPLETED';
                tx.receipt = 'VERIFIED-ONLINE';
            } else if (queryRes.ResultCode === '1032') {
                tx.status = 'FAILED';
                tx.failureReason = 'Cancelled by user';
            }
        }
    }

    return res.json({ 
        success: true, 
        status: tx.status, 
        receipt: tx.receipt || null,
        orderNumber: tx.orderNumber 
    });
}

app.post('/api/check-payment-status', async (req, res) => {
    const id = req.body.checkoutRequestId || req.body.id;
    return handleStatusCheck(id, res);
});

app.get('/api/check-status/:id', async (req, res) => {
    return handleStatusCheck(req.params.id, res);
});

// =======================
// PERSISTENT ORDERS API
// =======================

// Create / Save Order in Database & Dispatch Confirmation SMS
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        if (!orderData || !orderData.orderNumber || !orderData.phone) {
            return res.status(400).json({ success: false, message: 'Invalid order payload' });
        }

        const savedOrder = db.saveOrder(orderData);

        // Send Automated SMS
        if (savedOrder.status === 'CONFIRMED') {
            smsService.sendOrderConfirmation(savedOrder).catch(e => console.error('SMS notification error:', e));
        }

        res.json({ success: true, order: savedOrder });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Orders (with optional filter by status or search query)
app.get('/api/orders', (req, res) => {
    const { status, search } = req.query;
    const orders = db.getAllOrders({ status, search });
    res.json({ success: true, count: orders.length, orders });
});

// Get Single Order by Order Number
app.get('/api/orders/:orderNumber', (req, res) => {
    const order = db.getOrder(req.params.orderNumber);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
});

// Update Order Status (Admin action)
app.put('/api/orders/:orderNumber/status', (req, res) => {
    const { status, riderName, riderPhone, notes, passcode } = req.body;

    // Check admin passcode
    if (passcode !== ADMIN_PASSCODE) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Invalid admin passcode.' });
    }

    const updated = db.updateOrderStatus(req.params.orderNumber, status, { riderName, riderPhone, notes });
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found' });

    // If order is dispatched, send automated rider dispatch SMS
    if (status === 'DISPATCHED' && riderName) {
        smsService.sendDispatchNotice(updated, riderName, riderPhone || '+254715224878').catch(e => console.error(e));
    }

    res.json({ success: true, order: updated });
});

// =======================
// ADMIN DASHBOARD API
// =======================

// Admin Stats
app.get('/api/admin/stats', (req, res) => {
    const passcode = req.headers['x-admin-passcode'] || req.query.passcode;
    if (passcode !== ADMIN_PASSCODE) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const stats = db.getStats();
    res.json({ success: true, stats });
});

// Admin Inventory
app.get('/api/admin/inventory', (req, res) => {
    const passcode = req.headers['x-admin-passcode'] || req.query.passcode;
    if (passcode !== ADMIN_PASSCODE) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    res.json({ success: true, inventory: db.getInventory() });
});

// Update Inventory Stock
app.post('/api/admin/inventory/:productId', (req, res) => {
    const { stock, passcode } = req.body;
    if (passcode !== ADMIN_PASSCODE) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const updated = db.updateStock(req.params.productId, stock);
    res.json({ success: true, item: updated });
});

// Generate WhatsApp dispatch link for an order
app.get('/api/orders/:orderNumber/rider-whatsapp', (req, res) => {
    const order = db.getOrder(req.params.orderNumber);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const link = smsService.generateRiderWhatsAppLink(order);
    res.json({ success: true, link });
});

// =======================
// CLEAN URLS & STATIC PAGES
// =======================
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin.html')));
app.get('/order', (req, res) => res.sendFile(path.join(__dirname, '../frontend/order.html')));
app.get('/orders', (req, res) => res.sendFile(path.join(__dirname, '../frontend/orders.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, '../frontend/about.html')));
app.get('/blogs', (req, res) => res.sendFile(path.join(__dirname, '../frontend/blogs.html')));
app.get('/contacts', (req, res) => res.sendFile(path.join(__dirname, '../frontend/contacts.html')));

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, '../frontend/Index.html'));
});

// =======================
// SERVER START
// =======================
if (require.main === module || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🌿 Remedy Store Server is running on port ${PORT}`);
        console.log(`🌐 Storefront: http://localhost:${PORT}`);
        console.log(`🔒 Admin Portal: http://localhost:${PORT}/admin (Passcode: ${ADMIN_PASSCODE})`);
        console.log(`💳 M-Pesa Mode: ${hasRealCredentials() ? 'LIVE (Daraja)' : 'DEMO SIMULATION'}`);
    });
}

module.exports = app;
