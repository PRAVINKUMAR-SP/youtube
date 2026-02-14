'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import VideoCard from '../../components/VideoCard';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LikedPage() {
    const { user, token } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) fetchLikedVideos();
        else setLoading(false);
    }, [token]);

    const fetchLikedVideos = async () => {
        try {
            // Get all videos and filter liked ones (since we store likes as user ID arrays)
            const res = await fetch(`${API_URL}/videos?limit=100`);
            const data = await res.json();
            const liked = (data.videos || []).filter(v =>
                v.likes && v.likes.some(l => (l._id || l) === user._id)
            );
            setVideos(liked);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    if (!user) {
        return (
            <div className="page-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <svg viewBox="0 0 24 24" width="80" height="80" fill="#333" style={{ marginBottom: 16 }}>
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                </svg>
                <h2 style={{ color: '#fff', marginBottom: 8 }}>Liked Videos</h2>
                <p style={{ color: '#aaa', marginBottom: 16 }}>Sign in to see your liked videos</p>
                <Link href="/login" className="btn btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div className="page-fade-in">
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>👍 Liked Videos</h1>

            {loading ? (
                <div className="video-grid">
                    {[...Array(4)].map((_, i) => (
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
                    <p>No liked videos yet. Start watching and like some videos!</p>
                </div>
            )}
        </div>
    );
}
