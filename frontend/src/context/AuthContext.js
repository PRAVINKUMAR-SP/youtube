'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ytback-three.vercel.app/api';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('opffarmy_token');
        const savedUser = localStorage.getItem('opffarmy_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const register = async (username, email, password) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('opffarmy_token', data.token);
        localStorage.setItem('opffarmy_user', JSON.stringify(data.user));
        return data;
    };

    const login = async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('opffarmy_token', data.token);
        localStorage.setItem('opffarmy_user', JSON.stringify(data.user));
        return data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('opffarmy_token');
        localStorage.removeItem('opffarmy_user');
    };

    const refreshUser = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUser(data.user);
                localStorage.setItem('opffarmy_user', JSON.stringify(data.user));
            }
        } catch (err) {
            console.error('Failed to refresh user', err);
        }
    };

    const apiCall = async (endpoint, options = {}) => {
        const headers = { ...options.headers };
        if (token) headers.Authorization = `Bearer ${token}`;
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        return data;
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, apiCall, API_URL }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
