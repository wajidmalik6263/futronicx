// WhatsApp order notification service (Wappfly — https://wappfly.com).
//
// Wappfly links your existing WhatsApp number via WhatsApp Web, so there is no
// Meta approval, no templates, and no 24h window restriction. You just scan a QR
// code once and copy the API token from the dashboard.
//
// This is fire-and-forget: if the token/number are not set, notifications are
// silently skipped so the order flow never breaks.
//
// Required .env vars to enable:
//   WAPPFLY_TOKEN          API token from the Wappfly dashboard (per WhatsApp line)
//   WAPPFLY_ADMIN_NUMBER   Recipient number in international format (e.g. 923705621256)
//
// Optional:
//   WAPPFLY_API_URL        Override the send endpoint (default is the public API)

const { pool } = require('../db/db');

const TOKEN = process.env.WAPPFLY_TOKEN || process.env.XAPITOKEN;
const ADMIN_NUMBER_RAW = process.env.WAPPFLY_ADMIN_NUMBER || '923705621256';
const API_URL = process.env.WAPPFLY_API_URL || 'https://wappfly.com/api/messages/send';

const isConfigured = !!TOKEN;

if (isConfigured) {
    console.log('[WhatsApp] Wappfly configured — order WhatsApp notifications enabled.');
} else {
    console.log('[WhatsApp] Not configured — WhatsApp notifications disabled. Set WAPPFLY_TOKEN to enable.');
}

/**
 * Normalise a phone number to the international digits-only format WhatsApp expects.
 * Converts local Pakistani numbers like "03705621256" -> "923705621256".
 */
function normalizeNumber(raw) {
    if (!raw) return null;
    let digits = String(raw).replace(/[^\d]/g, '');
    if (digits.startsWith('0')) {
        // Local format -> assume Pakistan country code (92)
        digits = '92' + digits.slice(1);
    }
    return digits || null;
}

async function getStoreMeta() {
    try {
        const [rows] = await pool.query(
            'SELECT `key`, value FROM settings WHERE `key` IN (?, ?, ?)',
            ['store_name', 'currency_symbol', 'order_prefix']
        );
        const map = {};
        for (const row of rows) map[row.key] = row.value;
        return {
            storeName: map.store_name || 'North Dry Fruits',
            currency: map.currency_symbol || 'Rs.',
            orderPrefix: map.order_prefix || 'GB',
        };
    } catch {
        return { storeName: 'North Dry Fruits', currency: 'Rs.', orderPrefix: 'GB' };
    }
}

/**
 * Send a text message via the Wappfly REST API.
 */
async function sendText(number, text) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'X-API-Token': TOKEN,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            to: `${number}@s.whatsapp.net`,
            text,
        }),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    return res.json().catch(() => ({}));
}

/**
 * Send a new-order notification to the store admin's WhatsApp.
 * Fire-and-forget: never throws to the caller.
 */
async function sendOrderWhatsApp(order, items) {
    if (!isConfigured) return;

    const to = normalizeNumber(ADMIN_NUMBER_RAW);
    if (!to) {
        console.log('[WhatsApp] Skipped — no valid admin number configured.');
        return;
    }

    try {
        const { storeName, currency, orderPrefix } = await getStoreMeta();
        const trackingId = `${orderPrefix}-${order.id}`;

        const itemLines = (items || [])
            .map(i => `• ${i.product_name} (${i.weight_option}) x${i.quantity} — ${currency} ${i.price}`)
            .join('\n');

        const bodyText =
            `🛒 *New Order ${trackingId}* — ${storeName}\n\n` +
            `👤 ${order.customer_name}\n` +
            `📞 ${order.phone}\n` +
            `📍 ${order.address}\n` +
            `💳 ${order.payment_method || 'Cash on Delivery'}\n\n` +
            `*Items:*\n${itemLines}\n\n` +
            `*Total: ${currency} ${order.total}*`;

        await sendText(to, bodyText);
        console.log(`[WhatsApp] Order notification sent for order #${order.id} to ${to}`);
    } catch (err) {
        console.error('[WhatsApp] Failed to send order notification:', err.message);
    }
}

module.exports = { sendOrderWhatsApp, isConfigured };
