import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useLocation } from 'react-router-dom';
import api from '../api/api';

export default function ChatBot() {
    const { settings } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { cartItems } = useCart();
    const location = useLocation();

    // Check if bottom cart bar is visible on mobile
    const hideBarRoutes = ['/cart', '/checkout', '/order-confirmation'];
    const isCartBarVisible = cartItems?.length > 0 && !hideBarRoutes.includes(location.pathname);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (isOpen && !hasGreeted) {
            sendMessage('hi', true);
            setHasGreeted(true);
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const sendMessage = async (text, isAuto = false) => {
        const userMessage = text.trim();
        if (!userMessage) return;

        if (!isAuto) {
            setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        }
        setInput('');
        setIsTyping(true);

        try {
            const { data } = await api.post('/chatbot/message', { message: userMessage });
            setMessages(prev => [...prev, {
                role: 'bot',
                content: data.reply,
                products: data.products || [],
                suggestions: data.suggestions || []
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: 'Sorry, I\'m having trouble right now. Please try again in a moment.',
                products: [],
                suggestions: ['Browse Products', 'Track Order']
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleSuggestion = (text) => {
        if (text === 'Browse Products') {
            setMessages(prev => [...prev, { role: 'user', content: text }]);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: '🛍️ Visit our shop to explore all our products!\n\n[Browse All Products →](/products)',
                products: [],
                suggestions: ['Show Categories', 'Shipping Info']
            }]);
            return;
        }
        sendMessage(text);
    };

    const formatBotMessage = (content) => {
        // Convert markdown-style bold
        let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert markdown links [text](url)
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#D97706] underline font-bold hover:text-[#F5A623]">$1</a>');
        // Convert newlines
        formatted = formatted.replace(/\n/g, '<br/>');
        // Convert bullet points
        formatted = formatted.replace(/• /g, '<span class="text-[#D97706] mr-1">•</span>');
        return formatted;
    };

    const closedMobileBottom = isCartBarVisible ? 'bottom-[11rem]' : 'bottom-24';
    const closedDesktopBottom = 'md:bottom-24';
    const openMobileBottom = 'bottom-0'; // Snaps to corner when open

    return (
        <>
            {/* Chat Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen
                    ? `bg-[#3A2E1F] text-white ${openMobileBottom} sm:bottom-6 right-0 sm:right-6 sm:rounded-full rounded-none w-full sm:w-14`
                    : `bg-gradient-to-br from-[#F5A623] to-[#D97706] text-[#3A2E1F] ${closedMobileBottom} ${closedDesktopBottom} right-5`
                    }`}
                style={{ zIndex: 9998 }}
                aria-label={isOpen ? 'Close chat' : 'Open AI Assistant'}
            >
                {isOpen ? <X className="w-6 h-6" /> : (
                    <div className="relative">
                        <MessageCircle className="w-6 h-6" />
                        <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-white" />
                    </div>
                )}
            </button>

            {/* Tooltip when closed */}
            {!isOpen && (
                <div className={`fixed ${isCartBarVisible ? 'bottom-[11.9rem]' : 'bottom-[6.9rem]'} md:bottom-[6.9rem] right-[5.2rem] z-50 bg-[#3A2E1F] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-500 hidden md:block`}
                    style={{ zIndex: 9997 }}>
                    Need help? Ask me! 💬
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#3A2E1F] rotate-45" />
                </div>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div
                    className="fixed z-50 bg-[#FFFDF9] border border-[#E8DEC8] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in
                        bottom-0 right-0 w-full h-[100dvh] sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[520px] sm:rounded-3xl"
                    style={{ zIndex: 9999 }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#3A2E1F] to-[#5a4a3a] text-white px-5 py-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#F5A623] flex items-center justify-center shadow-sm">
                                <Bot className="w-5 h-5 text-[#3A2E1F]" />
                            </div>
                            <div>
                                <h3 className="font-heading font-bold text-sm">{settings.chatbot_name || 'GB AI Assistant'}</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] text-white/70 font-semibold">Online • Ready to help</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'bot' && (
                                    <div className="w-7 h-7 rounded-xl bg-[#F5A623]/20 flex items-center justify-center shrink-0 mt-1">
                                        <Bot className="w-4 h-4 text-[#D97706]" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-3 text-xs leading-relaxed ${msg.role === 'user'
                                        ? 'bg-[#F5A623] text-[#3A2E1F] rounded-2xl rounded-tr-md font-semibold'
                                        : 'bg-[#F5EFE0] text-[#3A2E1F] rounded-2xl rounded-tl-md'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.content) }}
                                    />

                                    {/* Product Cards */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {msg.products.map((p, pi) => (
                                                <Link
                                                    key={pi}
                                                    to={`/product/${p.slug}`}
                                                    className="flex items-center gap-3 p-2.5 bg-white border border-[#E8DEC8] rounded-xl hover:border-[#F5A623] hover:shadow-sm transition-all group"
                                                >
                                                    <img
                                                        src={p.image_url}
                                                        alt={p.name}
                                                        className="w-12 h-12 rounded-lg object-cover border border-[#E8DEC8]"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="text-[11px] font-bold text-[#3A2E1F] line-clamp-1 group-hover:text-[#D97706] transition-colors">{p.name}</h5>
                                                        <span className="text-[10px] font-bold text-[#D97706]">
                                                            {settings.currency_symbol || '$'}{p.base_price?.toLocaleString()}
                                                        </span>
                                                        {p.stock > 0 ? (
                                                            <span className="text-[9px] text-emerald-600 font-bold ml-2">In Stock</span>
                                                        ) : (
                                                            <span className="text-[9px] text-rose-600 font-bold ml-2">Out of Stock</span>
                                                        )}
                                                    </div>
                                                    <ExternalLink className="w-3.5 h-3.5 text-[#3A2E1F]/30 group-hover:text-[#D97706] shrink-0" />
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Suggestion Chips */}
                                    {msg.suggestions && msg.suggestions.length > 0 && i === messages.length - 1 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {msg.suggestions.map((s, si) => (
                                                <button
                                                    key={si}
                                                    onClick={() => handleSuggestion(s)}
                                                    className="px-3 py-1.5 bg-white border border-[#E8DEC8] hover:border-[#F5A623] hover:bg-[#F5A623]/10 text-[10px] font-bold text-[#3A2E1F] rounded-full transition-all"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-7 h-7 rounded-xl bg-[#3A2E1F] flex items-center justify-center shrink-0 mt-1">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-xl bg-[#F5A623]/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-[#D97706]" />
                                </div>
                                <div className="flex items-center gap-1.5 px-4 py-3 bg-[#F5EFE0] rounded-2xl rounded-tl-md">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-[#D97706] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 border-t border-[#E8DEC8] bg-[#FFFDF9] flex items-center gap-2 shrink-0">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about our products..."
                            className="flex-1 bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl px-4 py-2.5 text-sm text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all placeholder:text-[#3A2E1F]/40"
                            disabled={isTyping}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="w-10 h-10 bg-[#F5A623] hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed text-[#3A2E1F] hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
