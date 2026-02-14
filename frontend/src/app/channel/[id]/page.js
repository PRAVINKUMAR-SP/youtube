'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '../../../components/VideoCard';
import { useAuth } from '../../../context/AuthContext';
import './channel.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ytback-three.vercel.app/api';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://ytback-three.vercel.app';

export default function ChannelPage() {
    const { id } = useParams();
    const { user, token, apiCall } = useAuth();
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('videos');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchChannel();
            fetchVideos();
            fetchPosts();
            if (token) checkSubscription();
        }
    }, [id]);

    const fetchChannel = async () => {
        try {
            const res = await fetch(`${API_URL}/channels/${id}`);
            const data = await res.json();
            setChannel(data.channel);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const fetchVideos = async () => {
        try {
            const res = await fetch(`${API_URL}/videos/channel/${id}`);
            const data = await res.json();
            setVideos(data.videos || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_URL}/posts/channel/${id}`);
            const data = await res.json();
            setPosts(data.posts || []);
        } catch (err) {
            console.error(err);
        }
    };

    const checkSubscription = async () => {
        try {
            const data = await apiCall(`/subscriptions/check/${id}`);
            setIsSubscribed(data.subscribed);
        } catch (err) { }
    };

    const handleSubscribe = async () => {
        if (!token) return alert('Please sign in');
        try {
            const data = await apiCall(`/subscriptions/${id}`, { method: 'POST' });
            setIsSubscribed(data.subscribed);
            setChannel(prev => ({ ...prev, subscriberCount: data.subscriberCount }));
        } catch (err) {
            console.error(err);
        }
    };

    const formatCount = (n) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n?.toString() || '0';
    };

    if (loading) return (
        <div className="channel-page page-fade-in">
            <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 12 }}></div>
        </div>
    );

    if (!channel) return (
        <div className="channel-page" style={{ textAlign: 'center', padding: 80 }}>
            <h2>Channel not found</h2>
        </div>
    );

    const isOwner = user?.channel && (user.channel.id === id || user.channel._id === id || user.channel === id);

    return (
        <div className="channel-page page-fade-in">
            {/* Banner */}
            <div className="channel-banner">
                {channel.banner ? (
                    <img src={`${API_BASE}${channel.banner}`} alt="" />
                ) : (
                    <div className="banner-gradient"></div>
                )}
            </div>

            {/* Channel Header */}
            <div className="channel-header">
                <div className="channel-avatar-large">
                    {channel.avatar ? (
                        <img src={`${API_BASE}${channel.avatar}`} alt="" />
                    ) : (
                        <span>{channel.name?.[0]?.toUpperCase()}</span>
                    )}
                </div>
                <div className="channel-info">
                    <h1 className="channel-title">{channel.name}</h1>
                    <p className="channel-handle">{channel.handle}</p>
                    <p className="channel-stats">
                        {formatCount(channel.subscriberCount)} subscribers • {channel.videoCount || 0} videos
                    </p>
                    <p className="channel-desc">{channel.description}</p>
                </div>
                <div className="channel-actions">
                    {isOwner ? (
                        <Link href="/upload" className="btn btn-secondary">Upload Video</Link>
                    ) : (
                        <button
                            className={`btn btn-subscribe ${isSubscribed ? 'subscribed' : ''}`}
                            onClick={handleSubscribe}
                        >
                            {isSubscribed ? 'Subscribed' : 'Subscribe'}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="channel-tabs">
                <button className={`channel-tab ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>Videos</button>
                <button className={`channel-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Posts</button>
                <button className={`channel-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>About</button>
            </div>

            {/* Content */}
            {activeTab === 'videos' && (
                <div className="video-grid">
                    {videos.length > 0 ? videos.map(v => (
                        <VideoCard key={v.id || v._id} video={v} />
                    )) : (
                        <p style={{ color: '#aaa', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No videos yet</p>
                    )}
                </div>
            )}

            {activeTab === 'posts' && (
                <div className="posts-list">
                    {posts.length > 0 ? posts.map(post => (
                        <div key={post.id || post._id} className="post-card">
                            <div className="post-header">
                                <div className="channel-avatar-small" style={{ width: 36, height: 36 }}>
                                    {channel.avatar ? (
                                        <img src={`${API_BASE}${channel.avatar}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #ff4444, #ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>{channel.name?.[0]?.toUpperCase()}</span>
                                    )}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: 14 }}>{channel.name}</p>
                                    <p style={{ color: '#aaa', fontSize: 12 }}>{new Date(post.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className="post-content">{post.content}</p>
                            {post.imageUrl && (
                                <img src={`${API_BASE}${post.imageUrl}`} alt="" className="post-image" />
                            )}
                            <div className="post-footer">
                                <span>👍 {post.likes?.length || 0}</span>
                            </div>
                        </div>
                    )) : (
                        <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>No posts yet</p>
                    )}
                </div>
            )}

            {activeTab === 'about' && (
                <div className="about-section">
                    <h3>Description</h3>
                    <p>{channel.description || 'No description provided.'}</p>
                    <h3>Stats</h3>
                    <p>Joined {new Date(channel.createdAt).toLocaleDateString()}</p>
                    <p>{formatCount(channel.subscriberCount)} subscribers</p>
                    <p>{channel.videoCount || 0} videos</p>
                </div>
            )}
        </div>
    );
}
