'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import './watch.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ytback-three.vercel.app/api';
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://ytback-three.vercel.app';

export default function WatchPage() {
    const { id } = useParams();
    const { user, token, apiCall } = useAuth();
    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchVideo();
    }, [id]);

    const fetchVideo = async () => {
        try {
            const headers = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${API_URL}/videos/${id}`, { headers });
            const data = await res.json();
            setVideo(data.video);
            setComments(data.comments || []);

            // Check subscription status
            if (token && data.video?.channel?._id) {
                try {
                    const subRes = await fetch(`${API_URL}/subscriptions/check/${data.video.channel._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const subData = await subRes.json();
                    setIsSubscribed(subData.subscribed);
                } catch (e) { }
            }
        } catch (err) {
            console.error('Failed to fetch video', err);
        }
        setLoading(false);
    };

    const handleLike = async (action) => {
        if (!token) return alert('Please sign in to like videos');
        try {
            const data = await apiCall(`/videos/${id}/${action}`, { method: 'PUT' });
            setVideo(prev => ({ ...prev, likes: Array(data.likes).fill(null), dislikes: Array(data.dislikes).fill(null) }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubscribe = async () => {
        if (!token) return alert('Please sign in to subscribe');
        try {
            const data = await apiCall(`/subscriptions/${video.channel._id}`, { method: 'POST' });
            setIsSubscribed(data.subscribed);
            setVideo(prev => ({
                ...prev,
                channel: { ...prev.channel, subscriberCount: data.subscriberCount }
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !token) return;
        try {
            const data = await apiCall(`/videos/${id}/comments`, {
                method: 'POST',
                body: JSON.stringify({ text: commentText })
            });
            setComments([data.comment, ...comments]);
            setCommentText('');
        } catch (err) {
            console.error(err);
        }
    };

    const formatViews = (n) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n?.toString() || '0';
    };

    if (loading) return (
        <div className="watch-page page-fade-in">
            <div className="video-player-skeleton skeleton" style={{ aspectRatio: '16/9', borderRadius: 12 }}></div>
            <div className="skeleton" style={{ width: '60%', height: 24, marginTop: 16 }}></div>
            <div className="skeleton" style={{ width: '40%', height: 16, marginTop: 8 }}></div>
        </div>
    );

    if (!video) return (
        <div className="watch-page" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h2>Video not found</h2>
            <Link href="/" style={{ color: '#3ea6ff', marginTop: 16, display: 'inline-block' }}>Go home</Link>
        </div>
    );

    return (
        <div className="watch-page page-fade-in">
            <div className="watch-main">
                {/* Video Player */}
                <div className="video-player-container">
                    <video
                        className="video-player"
                        src={`${API_BASE}${video.videoUrl}`}
                        controls
                        autoPlay
                        poster={video.thumbnailUrl ? `${API_BASE}${video.thumbnailUrl}` : ''}
                    />
                </div>

                {/* Video Info */}
                <h1 className="watch-title">{video.title}</h1>

                <div className="watch-actions">
                    <div className="watch-channel-info">
                        <Link href={`/channel/${video.channel?._id}`} className="watch-channel-avatar">
                            {video.channel?.avatar ? (
                                <img src={`${API_BASE}${video.channel.avatar}`} alt="" />
                            ) : (
                                <span>{video.channel?.name?.[0]?.toUpperCase()}</span>
                            )}
                        </Link>
                        <div className="watch-channel-details">
                            <Link href={`/channel/${video.channel?._id}`} className="watch-channel-name">
                                {video.channel?.name}
                            </Link>
                            <span className="watch-channel-subs">
                                {formatViews(video.channel?.subscriberCount)} subscribers
                            </span>
                        </div>
                        <button
                            className={`btn btn-subscribe ${isSubscribed ? 'subscribed' : ''}`}
                            onClick={handleSubscribe}
                        >
                            {isSubscribed ? 'Subscribed' : 'Subscribe'}
                        </button>
                    </div>

                    <div className="watch-buttons">
                        <button className="watch-action-btn" onClick={() => handleLike('like')}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                            </svg>
                            <span>{video.likes?.length || 0}</span>
                        </button>
                        <button className="watch-action-btn" onClick={() => handleLike('dislike')}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ transform: 'rotate(180deg)' }}>
                                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                            </svg>
                            <span>{video.dislikes?.length || 0}</span>
                        </button>
                        <div className="watch-action-btn views-count">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                            </svg>
                            <span>{formatViews(video.views)} views</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="watch-description">
                    <p>{video.description || 'No description'}</p>
                    {video.tags?.length > 0 && (
                        <div className="watch-tags">
                            {video.tags.map((tag, i) => (
                                <span key={i} className="watch-tag">#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Comments */}
                <div className="comments-section">
                    <h3 className="comments-title">{comments.length} Comments</h3>

                    {token && (
                        <form className="comment-form" onSubmit={handleComment}>
                            <div className="comment-avatar">
                                <span>{user?.username?.[0]?.toUpperCase()}</span>
                            </div>
                            <div className="comment-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="comment-input"
                                />
                                <div className="comment-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setCommentText('')}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={!commentText.trim()}>Comment</button>
                                </div>
                            </div>
                        </form>
                    )}

                    <div className="comments-list">
                        {comments.map(comment => (
                            <div key={comment._id} className="comment-item">
                                <div className="comment-avatar">
                                    <span>{comment.user?.username?.[0]?.toUpperCase()}</span>
                                </div>
                                <div className="comment-body">
                                    <div className="comment-header">
                                        <span className="comment-username">{comment.user?.username}</span>
                                        <span className="comment-time">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
