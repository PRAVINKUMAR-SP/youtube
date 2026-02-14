'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import VideoCard from '../../components/VideoCard';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ytback-three.vercel.app/api';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://ytback-three.vercel.app';

export default function SubscriptionsPage() {
    const { user, token, apiCall } = useAuth();
    const [channels, setChannels] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) fetchSubscriptions();
        else setLoading(false);
    }, [token]);

    const fetchSubscriptions = async () => {
        try {
            const data = await apiCall('/subscriptions');
            setChannels(data.subscriptions || []);

            // Fetch videos from subscribed channels
            const allVideos = [];
            for (const ch of (data.subscriptions || [])) {
                try {
                    const vRes = await fetch(`${API_URL}/videos/channel/${ch._id}`);
                    const vData = await vRes.json();
                    allVideos.push(...(vData.videos || []));
                } catch (e) { }
            }
            // Sort by newest
            allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setVideos(allVideos);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    if (!user) {
        return (
            <div className="page-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <svg viewBox="0 0 24 24" width="80" height="80" fill="#333" style={{ marginBottom: 16 }}>
                    <path d="M10 18v-6l5 3-5 3zm7-15H7v2h10V3zm3 4H4v2h16V7zm2 4H2v10h20V11zm-2 8H4v-6h16v6z" />
                </svg>
                <h2 style={{ color: '#fff', marginBottom: 8 }}>Don&apos;t miss new videos</h2>
                <p style={{ color: '#aaa', marginBottom: 16 }}>Sign in to see updates from your favorite channels</p>
                <Link href="/login" className="btn btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div className="page-fade-in">
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Subscriptions</h1>

            {/* Subscribed Channels Bar */}
            {channels.length > 0 && (
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 24, scrollbarWidth: 'none' }}>
                    {channels.map(ch => (
                        <Link key={ch._id} href={`/channel/${ch._id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textDecoration: 'none', minWidth: 72 }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #ff4444, #ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 22, overflow: 'hidden' }}>
                                {ch.avatar ? <img src={`${API_BASE}${ch.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ch.name?.[0]?.toUpperCase()}
                            </div>
                            <span style={{ color: '#aaa', fontSize: 12, textAlign: 'center', maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
                        </Link>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="video-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i}>
                            <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12 }}></div>
                            <div style={{ display: 'flex', gap: 12, padding: '12px 0' }}>
                                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}></div>
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ width: '90%', height: 16, marginBottom: 8 }}></div>
                                    <div className="skeleton" style={{ width: '60%', height: 14 }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : videos.length > 0 ? (
                <div className="video-grid">
                    {videos.map(video => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
                    <p>No videos from your subscriptions yet</p>
                </div>
            )}
        </div>
    );
}
