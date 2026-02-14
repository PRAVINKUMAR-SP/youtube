'use client';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LibraryPage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="page-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <svg viewBox="0 0 24 24" width="80" height="80" fill="#333" style={{ marginBottom: 16 }}>
                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
                </svg>
                <h2 style={{ color: '#fff', marginBottom: 8 }}>Enjoy your favorite videos</h2>
                <p style={{ color: '#aaa', marginBottom: 16 }}>Sign in to access videos you&apos;ve liked or saved</p>
                <Link href="/login" className="btn btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div className="page-fade-in">
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Library</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                <Link href="/liked" style={{ background: '#1a1a1a', border: '1px solid #272727', borderRadius: 12, padding: 24, textDecoration: 'none', transition: 'background 0.2s' }}>
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="#3ea6ff" style={{ marginBottom: 12 }}>
                        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                    </svg>
                    <h3 style={{ color: 'white', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Liked Videos</h3>
                    <p style={{ color: '#aaa', fontSize: 14 }}>Videos you&apos;ve liked</p>
                </Link>

                {user.channel && (
                    <Link href={`/channel/${user.channel._id || user.channel}`} style={{ background: '#1a1a1a', border: '1px solid #272727', borderRadius: 12, padding: 24, textDecoration: 'none', transition: 'background 0.2s' }}>
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="#ff4444" style={{ marginBottom: 12 }}>
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Your Videos</h3>
                        <p style={{ color: '#aaa', fontSize: 14 }}>Videos on your channel</p>
                    </Link>
                )}
            </div>
        </div>
    );
}
