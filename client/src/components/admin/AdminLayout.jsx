import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Tags,
    LogOut,
    ExternalLink,
    Menu,
    X,
    Leaf,
    UserCircle,
    Settings,
    LayoutTemplate,
    CreditCard,
    MessageSquare,
    FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, adminUsername } = useAuth();
    const { settings } = useSettings();

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Homepage', path: '/admin/homepage', icon: LayoutTemplate },
        { name: 'Products', path: '/admin/products', icon: Package },
        { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
        { name: 'Payments', path: '/admin/payments', icon: CreditCard },
        { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
        { name: 'Blog', path: '/admin/blogs', icon: FileText },
        { name: 'Categories', path: '/admin/categories', icon: Tags },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-[#FFFDF9] font-body text-[#3A2E1F] flex flex-col md:flex-row antialiased">

            {/* MOBILE HEADER BAR */}
            <header className="md:hidden bg-[#F5EFE0] border-b border-[#E8DEC8] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
                <Link to="/admin/dashboard" className="flex items-center gap-2">
                    {settings.logo_url && !settings.logo_url.includes('placeholder') ? (
                        <img src={settings.logo_url} alt={settings.store_name} className="h-8 object-contain" />
                    ) : (
                        <>
                            <div className="w-8 h-8 rounded-xl bg-[#F5A623] flex items-center justify-center text-[#3A2E1F]">
                                <Leaf className="w-5 h-5 fill-current" />
                            </div>
                            <span className="font-heading font-extrabold text-lg text-[#3A2E1F]">
                                {settings.store_name || 'North Dry Fruits'} <span className="text-[#D97706] text-sm font-bold ml-1">Admin</span>
                            </span>
                        </>
                    )}
                </Link>
                <div className="flex items-center gap-2">
                    <Link to="/" className="p-2 text-[#3A2E1F]/70 hover:text-[#D97706]" title="View Storefront">
                        <ExternalLink className="w-5 h-5" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-[#3A2E1F] hover:text-[#D97706]"
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR (DESKTOP & MOBILE DRAWER) */}
            <aside className={`
        fixed md:sticky top-0 h-screen inset-y-0 left-0 z-50
        w-64 bg-[#F5EFE0]/80 border-r border-[#E8DEC8]
        flex flex-col justify-between shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                {/* Logo Brand Header (Fixed Top) */}
                <div className="p-6 pb-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <Link to="/admin/dashboard" className="flex items-center gap-3">
                            {settings.logo_url && !settings.logo_url.includes('placeholder') ? (
                                <img src={settings.logo_url} alt={settings.store_name} className="h-10 object-contain" />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-2xl bg-[#F5A623] flex items-center justify-center text-[#3A2E1F] shadow-sm">
                                        <Leaf className="w-6 h-6 fill-current" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold font-heading tracking-tight text-[#3A2E1F] leading-none">
                                            {settings.store_name || 'North Dry Fruits'}
                                        </span>
                                        <span className="text-[10px] font-semibold text-[#D97706] uppercase tracking-widest leading-tight mt-0.5">
                                            Control Center
                                        </span>
                                    </div>
                                </>
                            )}
                        </Link>
                        <button
                            type="button"
                            className="md:hidden text-[#3A2E1F]/60"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Items (Scrollable Middle Content) */}
                <div className="px-6 py-2 flex-1 overflow-y-auto space-y-1.5">
                    <nav className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#3A2E1F]/50 px-3 block mb-2">
                            Management
                        </span>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                    flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all
                    ${isActive
                                            ? 'bg-[#F5A623] text-[#3A2E1F] shadow-sm'
                                            : 'text-[#3A2E1F]/70 hover:bg-[#E8DEC8]/60 hover:text-[#3A2E1F]'
                                        }
                  `}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#3A2E1F]' : 'text-[#D97706]'}`} />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer / Logout (Fixed Bottom) */}
                <div className="p-6 border-t border-[#E8DEC8]/80 space-y-4 shrink-0">
                    <div className="flex items-center gap-3 p-2 bg-[#FFFDF9]/60 rounded-2xl border border-[#E8DEC8]">
                        <UserCircle className="w-8 h-8 text-[#D97706]" />
                        <div className="flex flex-col text-xs overflow-hidden">
                            <span className="font-bold text-[#3A2E1F] truncate">{adminUsername || 'Store Admin'}</span>
                            <span className="text-[10px] text-[#3A2E1F]/60 truncate">{settings.contact_email || 'admin'}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-rose-50 border border-[#E8DEC8] hover:border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all shadow-xs"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* DESKTOP TOP BAR */}
                <header className="hidden md:flex items-center justify-between bg-[#FFFDF9] border-b border-[#E8DEC8] px-8 py-4 sticky top-0 z-30 shadow-xs">
                    <div>
                        <h2 className="font-heading font-bold text-lg text-[#3A2E1F]">Admin Dashboard</h2>
                        <p className="text-xs text-[#3A2E1F]/60">Welcome back, {adminUsername || 'admin'}!</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5EFE0] hover:bg-[#F5A623]/20 border border-[#E8DEC8] rounded-full text-xs font-bold text-[#3A2E1F] transition-all"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-[#D97706]" />
                            <span>View Storefront</span>
                        </Link>

                        <div className="h-6 w-px bg-[#E8DEC8]" />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#F5A623]/20 border border-[#F5A623] flex items-center justify-center font-extrabold text-xs text-[#D97706] uppercase">
                                {(adminUsername || 'A').charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-[#3A2E1F] capitalize">{adminUsername || 'admin'}</span>
                        </div>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>

        </div>
    );
}
