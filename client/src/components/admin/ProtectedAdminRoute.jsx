import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedAdminRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center text-[#3A2E1F] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#F5A623]" />
                <p className="text-sm font-bold animate-pulse">Verifying Admin Session...</p>
            </div>
        );
    }

    // If not authenticated, redirect to the login page immediately.
    return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
