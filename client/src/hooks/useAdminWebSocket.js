import { useEffect, useRef, useCallback } from 'react';

// Stop retrying after this many consecutive failures so an unreachable backend
// doesn't spam the console indefinitely. ~10 attempts spans several minutes of
// exponential backoff (capped at 30s), which comfortably covers a backend that
// is briefly restarting while still giving up on one that is simply down.
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Custom hook for admin WebSocket connection with auto-reconnect.
 * Connects to ws://host:port/ws?token=JWT and dispatches events.
 *
 * @param {Object} handlers - Event handler callbacks
 * @param {Function} handlers.onNewOrder - Called with order data on new_order event
 * @param {Function} handlers.onStatusUpdate - Called with {id, status, previous_status}
 * @param {Function} handlers.onPaymentUpdate - Called with {id, payment_status}
 * @param {Function} handlers.onConnected - Called when WebSocket connects
 */
export function useAdminWebSocket(handlers = {}) {
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    const connect = useCallback(() => {
        const token = localStorage.getItem('store_admin_token');
        if (!token) return;

        // Determine WebSocket URL from current location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        let wsHost;

        if (process.env.NODE_ENV === 'development') {
            // In dev mode, bypass Vite proxy and connect directly to backend to avoid ECONNABORTED
            wsHost = 'ws://localhost:5000';
        } else if (apiUrl && apiUrl.startsWith('http')) {
            try {
                const url = new URL(apiUrl);
                wsHost = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}`;
            } catch {
                wsHost = `${protocol}//${window.location.host}`;
            }
        } else {
            wsHost = `${protocol}//${window.location.host}`;
        }

        const wsUrl = `${wsHost}/ws?token=${encodeURIComponent(token)}`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[WS] Connected');
                reconnectAttemptsRef.current = 0;
                handlersRef.current.onConnected?.();
            };

            ws.onmessage = (event) => {
                try {
                    const { event: eventType, payload } = JSON.parse(event.data);

                    switch (eventType) {
                        case 'new_order':
                            try {
                                const AudioContext = window.AudioContext || window.webkitAudioContext;
                                if (AudioContext) {
                                    const ctx = new AudioContext();
                                    const osc1 = ctx.createOscillator();
                                    const osc2 = ctx.createOscillator();
                                    const gainNode = ctx.createGain();

                                    osc1.connect(gainNode);
                                    osc2.connect(gainNode);
                                    gainNode.connect(ctx.destination);

                                    // Chime frequencies (C6 + E6)
                                    osc1.type = 'sine';
                                    osc2.type = 'sine';
                                    osc1.frequency.setValueAtTime(1046.50, ctx.currentTime);
                                    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime);

                                    // Envelope
                                    gainNode.gain.setValueAtTime(0, ctx.currentTime);
                                    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);

                                    osc1.start(ctx.currentTime);
                                    osc2.start(ctx.currentTime);
                                    osc1.stop(ctx.currentTime + 1);
                                    osc2.stop(ctx.currentTime + 1);
                                }
                            } catch {
                                // Ignore audio creation errors
                            }
                            handlersRef.current.onNewOrder?.(payload);
                            break;
                        case 'order_status_updated':
                            handlersRef.current.onStatusUpdate?.(payload);
                            break;
                        case 'payment_status_updated':
                            handlersRef.current.onPaymentUpdate?.(payload);
                            break;
                        case 'connected':
                            // Welcome message, already handled via onopen
                            break;
                        default:
                            console.log('[WS] Unknown event:', eventType);
                    }
                } catch (err) {
                    console.error('[WS] Message parse error:', err);
                }
            };

            ws.onclose = (event) => {
                wsRef.current = null;

                // Don't reconnect on auth failures
                if (event.code === 4001 || event.code === 4003) {
                    console.warn('[WS] Auth failed, not reconnecting');
                    return;
                }

                // Cap reconnect attempts so an unreachable backend (e.g. server
                // not running in dev) degrades quietly instead of flooding the
                // console forever.
                if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                    console.warn(
                        `[WS] Gave up reconnecting after ${MAX_RECONNECT_ATTEMPTS} attempts — is the backend running on ${wsHost}?`
                    );
                    return;
                }

                // Exponential backoff reconnect: 1s, 2s, 4s, 8s, max 30s
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                reconnectAttemptsRef.current++;
                reconnectTimeoutRef.current = setTimeout(connect, delay);
            };

            // WebSocket `onerror` only ever receives a generic Event (never a
            // useful message), and `onclose` always fires right after to handle
            // reconnection. So we intentionally keep this quiet to avoid logging
            // "[object Event]" on every failed connection attempt.
            ws.onerror = () => {};
        } catch (err) {
            console.error('[WS] Connection error:', err);
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect]);

    return {
        isConnected: () => wsRef.current?.readyState === WebSocket.OPEN
    };
}
