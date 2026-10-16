const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const INVENTORY_FILE = path.join(DATA_DIR, 'inventory.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Product Stock Seeding
const DEFAULT_INVENTORY = {
    "cayenne-pepper": { stock: 45, lowStockThreshold: 10 },
    "castor-oil": { stock: 28, lowStockThreshold: 8 },
    "raw-honey": { stock: 15, lowStockThreshold: 5 },
    "hibiscus-flowers": { stock: 32, lowStockThreshold: 8 },
    "moringa-powder": { stock: 22, lowStockThreshold: 6 },
    "slippery-elm": { stock: 9, lowStockThreshold: 10 }, // Low stock trigger
    "turmeric-powder": { stock: 50, lowStockThreshold: 10 },
    "activated-charcoal": { stock: 35, lowStockThreshold: 8 },
    "ashwagandha-root": { stock: 19, lowStockThreshold: 5 },
    "flax-seeds": { stock: 40, lowStockThreshold: 10 },
    "chia-seeds": { stock: 14, lowStockThreshold: 5 },
    "stinging-nettle": { stock: 25, lowStockThreshold: 8 },
    "immunity-bundle": { stock: 12, lowStockThreshold: 4 },
    "gut-bundle": { stock: 8, lowStockThreshold: 4 },
    "radiance-bundle": { stock: 15, lowStockThreshold: 5 }
};

function readJsonFile(filePath, defaultValue) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
            return defaultValue;
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return defaultValue;
    }
}

function writeJsonFile(filePath, data) {
    try {
        const tempPath = `${filePath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tempPath, filePath);
        return true;
    } catch (err) {
        console.error(`Error writing ${filePath}:`, err.message);
        return false;
    }
}

// Initialize files if not existing
if (!fs.existsSync(INVENTORY_FILE)) {
    writeJsonFile(INVENTORY_FILE, DEFAULT_INVENTORY);
}

if (!fs.existsSync(ORDERS_FILE)) {
    writeJsonFile(ORDERS_FILE, []);
}

// ===================================
// DATABASE OPERATIONS
// ===================================

const db = {
    // 1. Orders
    getAllOrders(filters = {}) {
        let orders = readJsonFile(ORDERS_FILE, []);
        if (filters.status && filters.status !== 'ALL') {
            orders = orders.filter(o => o.status === filters.status);
        }
        if (filters.search) {
            const q = filters.search.toLowerCase();
            orders = orders.filter(o => 
                o.orderNumber.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                o.phone.includes(q) ||
                (o.receipt && o.receipt.toLowerCase().includes(q))
            );
        }
        // Sort newest first
        return orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    },

    getOrder(orderNumber) {
        const orders = readJsonFile(ORDERS_FILE, []);
        return orders.find(o => o.orderNumber === orderNumber) || null;
    },

    saveOrder(orderData) {
        const orders = readJsonFile(ORDERS_FILE, []);
        const existingIdx = orders.findIndex(o => o.orderNumber === orderData.orderNumber);

        const record = {
            ...orderData,
            updatedAt: new Date().toISOString()
        };

        if (existingIdx >= 0) {
            orders[existingIdx] = { ...orders[existingIdx], ...record };
        } else {
            record.createdAt = record.createdAt || new Date().toISOString();
            orders.unshift(record);
        }

        writeJsonFile(ORDERS_FILE, orders);

        // Deduct inventory stock if confirmed
        if (record.status === 'CONFIRMED' && record.items) {
            record.items.forEach(item => {
                if (item.id) {
                    this.deductStock(item.id, item.quantity || 1);
                }
            });
        }

        return record;
    },

    updateOrderStatus(orderNumber, newStatus, metadata = {}) {
        const orders = readJsonFile(ORDERS_FILE, []);
        const order = orders.find(o => o.orderNumber === orderNumber);
        if (!order) return null;

        order.status = newStatus;
        order.updatedAt = new Date().toISOString();
        if (metadata.riderName) order.riderName = metadata.riderName;
        if (metadata.riderPhone) order.riderPhone = metadata.riderPhone;
        if (metadata.notes) order.notes = metadata.notes;
        if (metadata.receipt) order.receipt = metadata.receipt;

        writeJsonFile(ORDERS_FILE, orders);
        return order;
    },

    // 2. Inventory Management
    getInventory() {
        return readJsonFile(INVENTORY_FILE, DEFAULT_INVENTORY);
    },

    updateStock(productId, newStock) {
        const inv = readJsonFile(INVENTORY_FILE, DEFAULT_INVENTORY);
        if (!inv[productId]) {
            inv[productId] = { stock: Number(newStock), lowStockThreshold: 8 };
        } else {
            inv[productId].stock = Math.max(0, Number(newStock));
        }
        writeJsonFile(INVENTORY_FILE, inv);
        return inv[productId];
    },

    deductStock(productId, qty) {
        const inv = readJsonFile(INVENTORY_FILE, DEFAULT_INVENTORY);
        if (inv[productId]) {
            inv[productId].stock = Math.max(0, inv[productId].stock - Number(qty));
            writeJsonFile(INVENTORY_FILE, inv);
        }
    },

    // 3. Analytics & Stats
    getStats() {
        const orders = readJsonFile(ORDERS_FILE, []);
        const inventory = readJsonFile(INVENTORY_FILE, DEFAULT_INVENTORY);

        const totalRevenue = orders
            .filter(o => o.status !== 'CANCELLED')
            .reduce((sum, o) => sum + (o.totals?.grandTotal || o.total || 0), 0);

        const todayDate = new Date().toISOString().split('T')[0];
        const todayRevenue = orders
            .filter(o => o.status !== 'CANCELLED' && (o.createdAt || '').startsWith(todayDate))
            .reduce((sum, o) => sum + (o.totals?.grandTotal || o.total || 0), 0);

        const pendingOrders = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PENDING').length;
        const dispatchedOrders = orders.filter(o => o.status === 'DISPATCHED').length;
        const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;

        // Low stock items count
        let lowStockCount = 0;
        for (const [id, item] of Object.entries(inventory)) {
            if (item.stock <= (item.lowStockThreshold || 10)) {
                lowStockCount++;
            }
        }

        return {
            totalRevenue,
            todayRevenue,
            totalOrders: orders.length,
            pendingOrders,
            dispatchedOrders,
            deliveredOrders,
            lowStockCount
        };
    }
};

module.exports = db;
