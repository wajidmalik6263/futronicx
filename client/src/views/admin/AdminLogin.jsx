import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { settings } = useSettings();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        const result = await login(username, password);

        setIsLoading(false);
        if (result.success) {
            navigate('/admin/dashboard');
        } else {
            setErrorMsg(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFDF9] font-body text-[#3A2E1F] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">

            {/* Background Ornaments */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F5A623]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Login Container */}
            <div className="w-full max-w-md space-y-8 relative z-10">

                {/* Brand Header */}
                <div className="text-center space-y-3">
                    <Link to="/" className="inline-flex items-center gap-2 group">
                        {settings.logo_url && !settings.logo_url.includes('placeholder') ? (
                            <img src={settings.logo_url} alt={settings.store_name} className="h-16 object-contain" />
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-2xl bg-[#F5A623] flex items-center justify-center text-[#3A2E1F] shadow-sm group-hover:bg-[#D97706] transition-colors">
                                    <Leaf className="w-7 h-7 fill-current" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-3xl font-extrabold font-heading tracking-tight text-[#3A2E1F] leading-none">
                                        {settings.store_name || 'North Dry Fruits'}
                                    </span>
                                    <span className="text-[10px] font-semibold text-[#D97706] uppercase tracking-widest leading-tight">
                                        Store Administration
                                    </span>
                                </div>
                            </>
                        )}
                    </Link>
                    <h1 className="text-2xl font-bold font-heading text-[#3A2E1F] pt-2">
                        Admin Portal Sign In
                    </h1>
                    <p className="text-xs text-[#3A2E1F]/70">
                        Enter your administrative credentials to manage store operations
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-[#FFFDF9] border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">

                    {/* Inline Error Box */}
                    {errorMsg && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in duration-200">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Authentication Error</p>
                                <p className="text-rose-700 mt-0.5">{errorMsg}</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl pl-10 pr-4 py-3 text-sm text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                                    placeholder="Enter admin username"
                                />
                                <User className="w-4 h-4 text-[#3A2E1F]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-[#3A2E1F] uppercase tracking-wider block">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#F5EFE0]/50 border border-[#E8DEC8] rounded-xl pl-10 pr-10 py-3 text-sm text-[#3A2E1F] focus:outline-none focus:ring-2 focus:ring-[#F5A623] transition-all"
                                    placeholder="••••••••••••"
                                />
                                <Lock className="w-4 h-4 text-[#3A2E1F]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3A2E1F]/50 hover:text-[#3A2E1F]"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-[#F5A623] hover:bg-[#D97706] disabled:bg-[#E8DEC8] text-[#3A2E1F] hover:text-white disabled:text-[#3A2E1F]/50 font-bold text-sm rounded-full shadow-md hover:shadow-lg disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2 pt-3"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In to Dashboard</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Back Link */}
                <div className="text-center pt-2">
                    <Link to="/" className="text-xs font-semibold text-[#3A2E1F]/70 hover:text-[#D97706] transition-colors">
                        ← Back to Storefront Home
                    </Link>
                </div>

            </div>
        </div>
    );
}
