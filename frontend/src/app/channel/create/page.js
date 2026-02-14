'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import '../../upload/upload.css';

export default function CreateChannelPage() {
    const { user, token, refreshUser, API_URL } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [handle, setHandle] = useState('');
    const [description, setDescription] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!user) {
        return (
            <div className="upload-page page-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <h2>Please sign in first</h2>
                <button className="btn btn-primary" onClick={() => router.push('/login')} style={{ marginTop: 16 }}>Sign In</button>
            </div>
        );
    }

    if (user.channel) {
        return (
            <div className="upload-page page-fade-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <h2>You already have a channel!</h2>
                <button className="btn btn-primary" onClick={() => router.push(`/channel/${user.channel._id || user.channel}`)} style={{ marginTop: 16 }}>View Channel</button>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('handle', handle.startsWith('@') ? handle : `@${handle}`);
        formData.append('description', description);
        if (avatar) formData.append('avatar', avatar);
        if (banner) formData.append('banner', banner);

        try {
            const res = await fetch(`${API_URL}/channels`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            await refreshUser();
            router.push(`/channel/${data.channel._id}`);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="upload-page page-fade-in">
            <h1 className="upload-title">Create Your Channel</h1>

            {error && <div className="message error">{error}</div>}

            <form className="upload-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Channel Name *</label>
                    <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome Channel" required maxLength={50} />
                </div>

                <div className="form-group">
                    <label className="form-label">Handle *</label>
                    <input type="text" className="form-input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@myhandle" required />
                    <small style={{ color: '#717171', fontSize: 12 }}>This will be your unique channel identifier</small>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell viewers about your channel" maxLength={1000} />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Avatar</label>
                        <input type="file" accept="image/*" className="form-input" onChange={(e) => setAvatar(e.target.files[0])} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Banner</label>
                        <input type="file" accept="image/*" className="form-input" onChange={(e) => setBanner(e.target.files[0])} />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                    {loading ? 'Creating...' : 'Create Channel'}
                </button>
            </form>
        </div>
    );
}
