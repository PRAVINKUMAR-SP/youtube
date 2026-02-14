'use client';
import { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const categories = ['All', 'Music', 'Gaming', 'Education', 'Entertainment', 'Sports', 'News', 'Technology', 'Comedy', 'Vlogs'];

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchVideos();
  }, [activeCategory]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.set('category', activeCategory);
      const res = await fetch(`${API_URL}/videos?${params}`);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error('Failed to fetch videos', err);
    }
    setLoading(false);
  };

  return (
    <div className="page-fade-in">
      <div className="category-pills">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="video-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="video-card-skeleton">
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
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
          <svg viewBox="0 0 24 24" width="80" height="80" fill="#333" style={{ marginBottom: 16 }}>
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          <h2 style={{ color: '#fff', marginBottom: 8 }}>No videos yet</h2>
          <p>Be the first to upload a video on OpfFarmy!</p>
        </div>
      )}
    </div>
  );
}
