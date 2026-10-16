const axios = require('axios');

const {
    AT_API_KEY,
    AT_USERNAME = 'sandbox',
    AT_SENDER_ID,
    NODE_ENV = 'development'
} = process.env;

const hasCredentials = Boolean(AT_API_KEY && AT_API_KEY !== 'your_api_key_here');

const smsService = {
    async sendSMS(to, message) {
        // Normalize Kenyan phone
        let phone = String(to).replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '+254' + phone.slice(1);
        if (phone.startsWith('7') || phone.startsWith('1')) phone = '+254' + phone;
        if (phone.startsWith('254')) phone = '+' + phone;

        if (hasCredentials) {
            try {
                const endpoint = AT_USERNAME === 'sandbox'
                    ? 'https://api.sandbox.africastalking.com/version1/messaging'
                    : 'https://api.africastalking.com/version1/messaging';

                const params = new URLSearchParams();
                params.append('username', AT_USERNAME);
                params.append('to', phone);
                params.append('message', message);
                if (AT_SENDER_ID) params.append('from', AT_SENDER_ID);

                const response = await axios.post(endpoint, params.toString(), {
                    headers: {
                        'apiKey': AT_API_KEY,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    timeout: 8000
                });

                console.log(`[Africa's Talking SMS Sent] to ${phone}: ${response.data?.SMSMessageData?.Message || 'Success'}`);
                return { success: true, delivered: true, data: response.data };
            } catch (err) {
                console.error(`[SMS Error] Failed to send SMS to ${phone}:`, err.response?.data || err.message);
                return { success: false, error: err.message };
            }
        }

        // DEVELOPMENT / SIMULATION LOGGING
        console.log(`\n======================================================`);
        console.log(`📲 [SIMULATED SMS to ${phone}]`);
        console.log(message);
        console.log(`======================================================\n`);

        return { success: true, simulated: true, to: phone, message };
    },

    // 1. Order Confirmation SMS
    async sendOrderConfirmation(order) {
        const msg = `Habari ${order.customerName.split(' ')[0]}! We received your KES ${order.totals?.grandTotal?.toLocaleString() || order.total?.toLocaleString()} M-Pesa payment (Ref: ${order.receipt || 'CONFIRMED'}) for order ${order.orderNumber}. Our team is packing your herbal remedies. Track your delivery: http://localhost:3000/orders`;
        return this.sendSMS(order.phone, msg);
    },

    // 2. Courier Out For Delivery SMS
    async sendDispatchNotice(order, riderName, riderPhone) {
        const msg = `Good news ${order.customerName.split(' ')[0]}! Your Remedy Store order ${order.orderNumber} is OUT FOR DELIVERY with rider ${riderName} (${riderPhone}). Please keep your phone reachable.`;
        return this.sendSMS(order.phone, msg);
    },

    // 3. WhatsApp Dispatch Text Link Generator
    generateRiderWhatsAppLink(order) {
        const riderText = encodeURIComponent(
            `*REMEDY STORE DISPATCH*\n` +
            `Order: ${order.orderNumber}\n` +
            `Customer: ${order.customerName}\n` +
            `Phone: ${order.phone}\n` +
            `Destination: ${order.address}, ${order.city || order.county}\n` +
            `Total: KES ${(order.totals?.grandTotal || order.total || 0).toLocaleString()}\n` +
            `Status: ${order.status}\n` +
            `Items: ${order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}`
        );
        return `https://wa.me/?text=${riderText}`;
    }
};

module.exports = smsService;
