'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import './upload.css';

export default function UploadPage() {
    const { user, token, apiCall, API_URL } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('video');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Video form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Other');
    const [tags, setTags] = useState('');
    const [duration, setDuration] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);

    // Post form
    const [postContent, setPostContent] = useState('');
    const [postImage, setPostImage] = useState(null);

    if (!user) {
        return (
            <div className="upload-page page-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <h2>Please sign in to upload</h2>
                <button className="btn btn-primary" onClick={() => router.push('/login')} style={{ marginTop: 16 }}>Sign In</button>
            </div>
        );
    }

    if (!user.channel) {
        return (
            <div className="upload-page page-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <h2>Create a channel first</h2>
                <p style={{ color: '#aaa', margin: '8px 0 16px' }}>You need a channel to upload content</p>
                <button className="btn btn-primary" onClick={() => router.push('/channel/create')}>Create Channel</button>
            </div>
        );
    }

    const handleVideoUpload = async (e) => {
        e.preventDefault();
        if (!videoFile) return setError('Please select a video file');
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('video', videoFile);
        if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('tags', tags);
        formData.append('duration', duration);

        try {
            const res = await fetch(`${API_URL}/videos`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess('Video uploaded successfully!');
            setTimeout(() => router.push(`/watch/${data.video._id}`), 1500);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handlePostCreate = async (e) => {
        e.preventDefault();
        if (!postContent.trim()) return setError('Please enter post content');
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('content', postContent);
        if (postImage) formData.append('image', postImage);

        try {
            const res = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess('Post created successfully!');
            setPostContent('');
            setPostImage(null);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="upload-page page-fade-in">
            <h1 className="upload-title">Upload Content</h1>

            <div className="upload-tabs">
                <button className={`upload-tab ${activeTab === 'video' ? 'active' : ''}`} onClick={() => setActiveTab('video')}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></svg>
                    Upload Video
                </button>
                <button className={`upload-tab ${activeTab === 'post' ? 'active' : ''}`} onClick={() => setActiveTab('post')}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                    Create Post
                </button>
            </div>

            {error && <div className="message error">{error}</div>}
            {success && <div className="message success">{success}</div>}

            {activeTab === 'video' ? (
                <form className="upload-form" onSubmit={handleVideoUpload}>
                    <div className="upload-dropzone" onClick={() => document.getElementById('videoInput').click()}>
                        {videoFile ? (
                            <div className="file-selected">
                                <svg viewBox="0 0 24 24" width="40" height="40" fill="#4caf50"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                <p>{videoFile.name}</p>
                                <span>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>
                            </div>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" width="60" height="60" fill="#555"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" /></svg>
                                <p>Click to select video file</p>
                                <span>MP4, AVI, MOV, MKV, WebM (max 500MB)</span>
                            </>
                        )}
                        <input type="file" id="videoInput" accept="video/*" style={{ display: 'none' }} onChange={(e) => setVideoFile(e.target.files[0])} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter video title" required maxLength={100} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell viewers about your video" maxLength={5000} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                {['Music', 'Gaming', 'Education', 'Entertainment', 'Sports', 'News', 'Technology', 'Comedy', 'Vlogs', 'Other'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Duration</label>
                            <input type="text" className="form-input" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 10:30" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags (comma separated)</label>
                        <input type="text" className="form-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="gaming, tutorial, funny" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Thumbnail</label>
                        <input type="file" accept="image/*" className="form-input" onChange={(e) => setThumbnailFile(e.target.files[0])} />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? 'Uploading...' : 'Upload Video'}
                    </button>
                </form>
            ) : (
                <form className="upload-form" onSubmit={handlePostCreate}>
                    <div className="form-group">
                        <label className="form-label">Post Content *</label>
                        <textarea className="form-textarea" value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Share something with your subscribers..." required maxLength={2000} style={{ minHeight: 150 }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Image (optional)</label>
                        <input type="file" accept="image/*" className="form-input" onChange={(e) => setPostImage(e.target.files[0])} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Post'}
                    </button>
                </form>
            )}
        </div>
    );
}
