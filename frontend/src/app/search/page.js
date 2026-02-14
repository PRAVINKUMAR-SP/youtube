'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '../../components/VideoCard';
import './search.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ytback-aff991tmg-pravinkumars-projects-014325e2.vercel.app/api';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://ytback-aff991tmg-pravinkumars-projects-014325e2.vercel.app';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [videos, setVideos] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) searchContent();
    }, [query]);

    const searchContent = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setVideos(data.videos || []);
            setChannels(data.channels || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const formatCount = (n) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n?.toString() || '0';
    };

    if (!query) return (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
            <h2 style={{ color: 'white' }}>Search OpfFarmy</h2>
            <p>Enter a search term to find videos and channels</p>
        </div>
    );

    return (
        <div className="search-page page-fade-in">
            <h2 className="search-heading">Results for &quot;{query}&quot;</h2>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ width: '100%', height: 120, borderRadius: 12 }}></div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Channel Results */}
                    {channels.length > 0 && (
                        <div className="search-section">
                            <h3 className="search-section-title">Channels</h3>
                            <div className="channel-results">
                                {channels.map(ch => (
                                    <Link key={ch._id} href={`/channel/${ch._id}`} className="search-channel-card">
                                        <div className="search-channel-avatar">
                                            {ch.avatar ? (
                                                <img src={`${API_BASE}${ch.avatar}`} alt="" />
                                            ) : (
                                                <span>{ch.name?.[0]?.toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="search-channel-name">{ch.name}</p>
                                            <p className="search-channel-handle">{ch.handle}</p>
                                            <p className="search-channel-subs">{formatCount(ch.subscriberCount)} subscribers</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Video Results */}
                    {videos.length > 0 && (
                        <div className="search-section">
                            <h3 className="search-section-title">Videos</h3>
                            <div className="search-video-list">
                                {videos.map(v => (
                                    <VideoCard key={v._id} video={v} />
                                ))}
                            </div>
                        </div>
                    )}

                    {videos.length === 0 && channels.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
                            <h3 style={{ color: 'white', marginBottom: 8 }}>No results found</h3>
                            <p>Try different keywords or check your spelling</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 12 }}></div>}>
            <SearchContent />
        </Suspense>
    );
}
