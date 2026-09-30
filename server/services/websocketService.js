const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;

/**
 * Initialize WebSocket server on the same HTTP server.
 * Only admin clients with valid JWT tokens can connect.
 */
function initWebSocket(server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        // Authenticate via query param token
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const token = url.searchParams.get('token');

            if (!token) {
                ws.close(4001, 'Authentication required');
                return;
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            ws.isAdmin = true;
            ws.adminId = decoded.id || decoded.username;
            ws.isAlive = true;

            console.log(`[WebSocket] Admin connected: ${ws.adminId}`);

            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('close', () => {
                console.log(`[WebSocket] Admin disconnected: ${ws.adminId}`);
            });

            ws.on('error', (err) => {
                console.error(`[WebSocket] Error for ${ws.adminId}:`, err.message);
            });

            // Send welcome event
            ws.send(JSON.stringify({ event: 'connected', payload: { message: 'WebSocket connected' } }));
        } catch (err) {
            console.log('[WebSocket] Auth failed:', err.message);
            ws.close(4003, 'Invalid token');
        }
    });

    // Heartbeat interval — ping every 30s, terminate stale connections
    const heartbeat = setInterval(() => {
        if (!wss) return;
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                console.log('[WebSocket] Terminating stale connection');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(heartbeat);
    });

    console.log('[WebSocket] Server initialized on /ws');
    return wss;
}

/**
 * Broadcast an event to all connected admin clients.
 * @param {string} event - Event name (e.g. 'new_order', 'order_status_updated')
 * @param {object} payload - Event data
 */
function broadcastToAdmins(event, payload) {
    if (!wss) return;

    const message = JSON.stringify({ event, payload });
    let sent = 0;

    wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.isAdmin) {
            client.send(message);
            sent++;
        }
    });

    if (sent > 0) {
        console.log(`[WebSocket] Broadcast "${event}" to ${sent} admin(s)`);
    }
}

module.exports = { initWebSocket, broadcastToAdmins };
