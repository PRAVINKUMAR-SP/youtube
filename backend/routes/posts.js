const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// Multer config - Memory Storage
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// Helper: Upload file to Supabase Storage
const uploadFile = async (file, bucket, path) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });
    if (error) throw error;
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicData.publicUrl;
};

// Create post
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.user.channel) {
            return res.status(400).json({ message: 'You need to create a channel first' });
        }

        let imageUrl = '';
        if (req.file) {
            const fileName = `post-${req.user.id}-${Date.now()}`;
            imageUrl = await uploadFile(req.file, 'posts', fileName);
        }

        const { data: post, error } = await supabase
            .from('posts')
            .insert([{
                content: req.body.content,
                image_url: imageUrl,
                channel_id: req.user.channel.id || req.user.channel._id,
                author_id: req.user.id
            }])
            .select(`
                *,
                _id:id,
                author:users!inner(username, avatar, _id:id),
                channel:channels!inner(name, avatar, handle, _id:id)
            `)
            .single();

        if (error) throw error;

        // Frontend compatibility: mapping image_url to imageUrl
        const formattedPost = { ...post, imageUrl: post.image_url };

        res.status(201).json({ message: 'Post created', post: formattedPost });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get posts by channel
router.get('/channel/:channelId', async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                _id:id,
                author:users!inner(username, avatar, _id:id),
                channel:channels!inner(name, avatar, handle, _id:id)
            `)
            .eq('channel_id', req.params.channelId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedPosts = posts.map(p => ({ ...p, imageUrl: p.image_url }));
        res.json({ posts: formattedPosts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Like post (Toggle)
router.put('/:id/like', auth, async (req, res) => {
    try {
        const post_id = req.params.id;
        const user_id = req.user.id;

        const { data: existing } = await supabase
            .from('post_likes')
            .select('*')
            .eq('user_id', user_id)
            .eq('post_id', post_id)
            .single();

        if (existing) {
            await supabase.from('post_likes').delete().eq('id', existing.id);
        } else {
            await supabase.from('post_likes').insert([{ user_id, post_id }]);
        }

        const { count } = await supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', post_id);
        res.json({ likes: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
    try {
        const { data: post } = await supabase.from('posts').select('author_id').eq('id', req.params.id).single();
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.author_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await supabase.from('posts').delete().eq('id', req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
