import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';
// unused axios import removed

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminUsername, setAdminUsername] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Set up axios defaults and interceptor once
    useEffect(() => {
        const token = localStorage.getItem('store_admin_token');

        // Add request interceptor to attach JWT
        const requestInterceptor = api.interceptors.request.use((config) => {
            const currentToken = localStorage.getItem('store_admin_token');
            if (currentToken) {
                config.headers.Authorization = `Bearer ${currentToken}`;
            }
            return config;
        });

        const verifyToken = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/me');
                setAdminUsername(response.data.username);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Invalid or expired token, logging out.');
                localStorage.removeItem('store_admin_token');
                setIsAuthenticated(false);
                setAdminUsername(null);
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();

        return () => {
            api.interceptors.request.eject(requestInterceptor);
        };
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, username: returnedUsername } = response.data;

            localStorage.setItem('store_admin_token', token);
            setIsAuthenticated(true);
            setAdminUsername(returnedUsername);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Login failed. Please check your credentials.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('store_admin_token');
        setIsAuthenticated(false);
        setAdminUsername(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, adminUsername, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
