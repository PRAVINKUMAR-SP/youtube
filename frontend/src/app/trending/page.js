'use client';
import { useState, useEffect } from 'react';
import VideoCard from '../../components/VideoCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function TrendingPage() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch(`${API_URL}/videos?sort=popular&limit=20`);
                const data = await res.json();
                setVideos(data.videos || []);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchTrending();
    }, []);

    return (
        <div className="page-fade-in">
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>🔥 Trending</h1>
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
                    <p>No trending videos yet. Upload some content!</p>
                </div>
            )}
        </div>
    );
}
