import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

// Decide whether a caught error is a "backend unreachable / no connection"
// failure rather than a genuine application bug. Network failures should NOT
// surface the generic "Something Went Wrong" card — they get a dedicated
// connection screen (closer to the browser's own "can't reach the page").
function isNetworkError(error) {
    if (!error) return false;
    if (error.isNetworkError) return true;

    // Axios: a request was made but no response came back.
    if (error.request && !error.response) return true;
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') return true;

    // Native fetch / generic connection failures surface as a TypeError with
    // a recognisable message ("Failed to fetch", "Network request failed").
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('failed to fetch') || msg.includes('network request failed') || msg.includes('networkerror')) {
        return true;
    }

    // Browser reports we're offline.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;

    return false;
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
        // Bind in the constructor instead of using a class-field arrow.
        // A class field lowers to a `_defineProperty` Babel helper, and the
        // bundler co-locates that shared helper in the admin-only `editor`
        // (quill) chunk — which then gets statically imported by this entry
        // component, dragging quill's JS + CSS into the storefront's initial,
        // render-blocking load. Constructor binding emits no helper, so the
        // editor chunk stays fully lazy. Do NOT convert back to a class field.
        this.handleRetry = this.handleRetry.bind(this);
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleRetry() {
        this.setState({ hasError: false, error: null });
    }

    render() {
        if (this.state.hasError) {
            const networkError = isNetworkError(this.state.error);

            if (networkError) {
                return (
                    <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center px-6">
                        <div className="text-center space-y-6 max-w-md">
                            <div className="w-16 h-16 bg-[#F5EFE0] border border-[#E8DEC8] rounded-full flex items-center justify-center mx-auto">
                                <WifiOff className="w-8 h-8 text-[#D97706]" />
                            </div>
                            <h1 className="text-2xl font-extrabold font-heading text-[#3A2E1F]">
                                Can't Reach the Server
                            </h1>
                            <p className="text-sm text-[#3A2E1F]/70 leading-relaxed">
                                We couldn't connect to the server. Check your internet connection and try again.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={this.handleRetry}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-full shadow-md transition-all"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Try Again
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] font-bold text-sm rounded-full border border-[#E8DEC8] transition-all"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center px-6">
                    <div className="text-center space-y-6 max-w-md">
                        <div className="w-16 h-16 bg-rose-100 border border-rose-300 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-rose-600" />
                        </div>
                        <h1 className="text-2xl font-extrabold font-heading text-[#3A2E1F]">
                            Something Went Wrong
                        </h1>
                        <p className="text-sm text-[#3A2E1F]/70 leading-relaxed">
                            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] hover:bg-[#D97706] text-[#3A2E1F] hover:text-white font-bold text-sm rounded-full shadow-md transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5EFE0] hover:bg-[#E8DEC8] text-[#3A2E1F] font-bold text-sm rounded-full border border-[#E8DEC8] transition-all"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
