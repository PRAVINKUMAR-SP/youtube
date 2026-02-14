'use client';
import Link from 'next/link';
import './VideoCard.css';

export default function VideoCard({ video }) {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://ytback-three.vercel.app';

    const formatViews = (views) => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views?.toString() || '0';
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        return `${Math.floor(months / 12)}y ago`;
    };

    return (
        <div className="video-card">
            <Link href={`/watch/${video.id || video._id}`} className="thumbnail-wrapper">
                <div className="thumbnail">
                    {video.thumbnailUrl ? (
                        <img src={`${API_BASE}${video.thumbnailUrl}`} alt={video.title} />
                    ) : (
                        <div className="thumbnail-placeholder">
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="#555">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    )}
                    <span className="duration">{video.duration || '0:00'}</span>
                </div>
            </Link>
            <div className="video-info">
                {video.channel && (
                    <Link href={`/channel/${video.channel?.id || video.channel?._id}`} className="channel-avatar-small">
                        {video.channel.avatar ? (
                            <img src={`${API_BASE}${video.channel.avatar}`} alt="" />
                        ) : (
                            <span>{video.channel.name?.[0]?.toUpperCase()}</span>
                        )}
                    </Link>
                )}
                <div className="video-details">
                    <Link href={`/watch/${video.id || video._id}`} className="video-title">{video.title}</Link>
                    {video.channel && (
                        <Link href={`/channel/${video.channel?.id || video.channel?._id}`} className="channel-name">{video.channel.name}</Link>
                    )}
                    <p className="video-meta">
                        {formatViews(video.views)} views • {timeAgo(video.createdAt)}
                    </p>
                </div>
            </div>
        </div>
    );
}
