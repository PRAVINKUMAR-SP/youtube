const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// Multer config - Memory Storage for Supabase Uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Helper: Upload file to Supabase Storage
const uploadFile = async (file, bucket, path) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });
    if (error) throw error;

    // Get Public URL
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicData.publicUrl;
};

// Create channel
router.post('/', auth, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]), async (req, res) => {
    try {
        // Check if user already has a channel via the auth middleware user object
        // Note: req.user comes from Supabase query in auth middleware
        if (req.user.channel_id || req.user.channel) {
            return res.status(400).json({ message: 'You already have a channel' });
        }

        const { name, handle, description } = req.body;
        const owner_id = req.user.id;
        const validHandle = handle.startsWith('@') ? handle : `@${handle}`;

        let avatarUrl = '';
        let bannerUrl = '';

        // Upload Avatar
        if (req.files?.avatar?.[0]) {
            const fileName = `avatar-${owner_id}-${Date.now()}`;
            avatarUrl = await uploadFile(req.files.avatar[0], 'avatars', fileName);
        }

        // Upload Banner
        if (req.files?.banner?.[0]) {
            const fileName = `banner-${owner_id}-${Date.now()}`;
            bannerUrl = await uploadFile(req.files.banner[0], 'banners', fileName);
        }

        // Insert Channel
        const { data: channel, error } = await supabase
            .from('channels')
            .insert([{
                name,
                handle: validHandle,
                description,
                owner_id,
                avatar: avatarUrl,
                banner: bannerUrl
            }])
            .select('*, _id:id')
            .single();

        if (error) {
            if (error.code === '23505') return res.status(400).json({ message: 'Channel handle already taken' });
            throw error;
        }

        // Link Channel to User
        await supabase.from('users').update({ channel_id: channel.id }).eq('id', owner_id);

        res.status(201).json({ message: 'Channel created successfully', channel });
    } catch (error) {
        console.error('Create Channel Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get channel by ID
router.get('/:id', async (req, res) => {
    try {
        const { data: channel, error } = await supabase
            .from('channels')
            .select(`
                *,
                _id:id,
                owner:users!inner(username, avatar, _id:id)
            `)
            .eq('id', req.params.id)
            .single();

        if (error || !channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }
        res.json({ channel });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all channels
router.get('/', async (req, res) => {
    try {
        const { data: channels, error } = await supabase
            .from('channels')
            .select(`
                *,
                _id:id,
                owner:users!inner(username, avatar, _id:id)
            `)
            .order('subscriber_count', { ascending: false })
            .limit(20);

        if (error) throw error;
        res.json({ channels });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update channel
router.put('/:id', auth, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]), async (req, res) => {
    try {
        // Verify ownership
        const { data: channel } = await supabase.from('channels').select('owner_id').eq('id', req.params.id).single();

        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (channel.owner_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        const updates = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.description) updates.description = req.body.description;

        // Upload New Files
        if (req.files?.avatar?.[0]) {
            const fileName = `avatar-${req.user.id}-${Date.now()}`;
            updates.avatar = await uploadFile(req.files.avatar[0], 'avatars', fileName);
        }
        if (req.files?.banner?.[0]) {
            const fileName = `banner-${req.user.id}-${Date.now()}`;
            updates.banner = await uploadFile(req.files.banner[0], 'banners', fileName);
        }

        const { data: updatedChannel, error } = await supabase
            .from('channels')
            .update(updates)
            .eq('id', req.params.id)
            .select('*, _id:id')
            .single();

        if (error) throw error;

        res.json({ message: 'Channel updated', channel: updatedChannel });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
