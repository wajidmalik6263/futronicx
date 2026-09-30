import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api'
});

// Normalise "backend unreachable" style failures so the rest of the app can
// distinguish a genuine connection/network problem (server down, DNS failure,
// offline, request timed out, request blocked) from a real application error.
//
// Axios sets `error.response` only when the server actually answered. When the
// request never reaches a responding server, `error.response` is undefined and
// `error.request` is present — that is our signal for a network/connection
// failure. We tag it with `isNetworkError` so the ErrorBoundary (and any
// caller) can react to it specifically instead of treating it like an app bug.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const noResponse = !error.response && (error.request || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED');
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

        if (noResponse || offline) {
            error.isNetworkError = true;
        }

        return Promise.reject(error);
    }
);

export default api;
