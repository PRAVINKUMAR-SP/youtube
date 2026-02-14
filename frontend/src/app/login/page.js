'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            router.push('/');
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page page-fade-in">
            <div className="auth-card">
                <div className="auth-logo">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                        <path d="M10 8l6 4-6 4V8z" fill="white" />
                        <rect x="1" y="3" width="22" height="18" rx="4" stroke="#ff4444" strokeWidth="2" fill="none" />
                    </svg>
                    <h1>OpfFarmy</h1>
                </div>
                <h2 className="auth-title">Sign In</h2>
                <p className="auth-subtitle">to continue to OpfFarmy</p>

                {error && <div className="message error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don&apos;t have an account? <Link href="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
}
