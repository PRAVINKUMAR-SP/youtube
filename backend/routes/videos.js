const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const { auth, optionalAuth } = require('../middleware/auth');

// Multer config - Memory Storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'video') {
            if (file.mimetype.startsWith('video/')) return cb(null, true);
            cb(new Error('Only video files are allowed'));
        } else if (file.fieldname === 'thumbnail') {
            if (file.mimetype.startsWith('image/')) return cb(null, true);
            cb(new Error('Only image files are allowed for thumbnails'));
        } else {
            cb(null, true);
        }
    }
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
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicData.publicUrl;
};

// Upload video
router.post('/', auth, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.user.channel_id) {
            return res.status(400).json({ message: 'You need to create a channel first' });
        }
        if (!req.files?.video?.[0]) {
            return res.status(400).json({ message: 'Video file is required' });
        }

        const { title, description, category, tags, duration } = req.body;
        const channel_id = req.user.channel_id;

        // Upload Video
        const videoName = `video-${channel_id}-${Date.now()}`;
        const videoUrl = await uploadFile(req.files.video[0], 'videos', videoName);

        // Upload Thumbnail
        let thumbnailUrl = '';
        if (req.files?.thumbnail?.[0]) {
            const thumbName = `thumb-${channel_id}-${Date.now()}`;
            thumbnailUrl = await uploadFile(req.files.thumbnail[0], 'thumbnails', thumbName);
        }

        const { data: video, error } = await supabase
            .from('videos')
            .insert([{
                title,
                description,
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl,
                channel_id,
                uploader_id: req.user.id,
                category: category || 'Other',
                tags: tags ? tags.split(',').map(t => t.trim()) : [],
                duration: duration || '0:00'
            }])
            .select('*, _id:id')
            .single();

        if (error) throw error;

        // Increment video count
        // Note: Supabase doesn't have $inc simply, we can use an RPC or just 2 queries. 
        // For simplicity: fetch channel, increment, update.
        const { data: channelData } = await supabase.from('channels').select('video_count').eq('id', channel_id).single();
        await supabase.from('channels').update({ video_count: (channelData?.video_count || 0) + 1 }).eq('id', channel_id);

        res.status(201).json({ message: 'Video uploaded successfully', video });
    } catch (error) {
        console.error('Video Upload Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all videos
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const category = req.query.category;

        let query = supabase
            .from('videos')
            .select(`
                *,
                _id:id,
                channel:channels!inner(name, avatar, handle, _id:id),
                uploader:users!inner(username, avatar, _id:id)
            `, { count: 'exact' });

        if (category && category !== 'All') {
            query = query.eq('category', category);
        }

        // Pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data: videos, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        res.json({
            videos,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single video
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        // Increment views (Non-atomic increment for simplicity)
        // Ideally use RPC for atomic increment
        const { data: current } = await supabase.from('videos').select('views').eq('id', req.params.id).single();
        if (current) {
            await supabase.from('videos').update({ views: current.views + 1 }).eq('id', req.params.id);
        }

        const { data: video, error } = await supabase
            .from('videos')
            .select(`
                *,
                _id:id,
                channel:channels!inner(name, avatar, handle, subscriber_count, _id:id),
                uploader:users!inner(username, avatar, _id:id)
            `)
            .eq('id', req.params.id)
            .single();

        if (error || !video) return res.status(404).json({ message: 'Video not found' });

        // Get comments
        const { data: comments } = await supabase
            .from('comments')
            .select(`
                *,
                _id:id,
                user:users!inner(username, avatar, _id:id)
            `)
            .eq('video_id', req.params.id)
            .order('created_at', { ascending: false })
            .limit(50);

        res.json({ video, comments: comments || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get videos by channel
router.get('/channel/:channelId', async (req, res) => {
    try {
        const { data: videos, error } = await supabase
            .from('videos')
            .select(`
                 *,
                _id:id,
                channel:channels!inner(name, avatar, handle, _id:id)
            `)
            .eq('channel_id', req.params.channelId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ videos });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Like/Dislike Logic
// We will use the 'likes' table: user_id, video_id, type ('like' or 'dislike')
const handleLikeDislike = async (req, res, type) => {
    try {
        const video_id = req.params.id;
        const user_id = req.user.id;

        // Check existing vote
        const { data: existing } = await supabase
            .from('likes')
            .select('*')
            .eq('user_id', user_id)
            .eq('video_id', video_id)
            .single();

        if (existing) {
            if (existing.type === type) {
                // Toggle OFF (Remove vote)
                await supabase.from('likes').delete().eq('id', existing.id);
            } else {
                // Change vote (Update type)
                await supabase.from('likes').update({ type }).eq('id', existing.id);
            }
        } else {
            // New vote
            await supabase.from('likes').insert([{ user_id, video_id, type }]);
        }

        // Get counts
        const { count: likes } = await supabase.from('likes').select('id', { count: 'exact', head: true }).eq('video_id', video_id).eq('type', 'like');
        const { count: dislikes } = await supabase.from('likes').select('id', { count: 'exact', head: true }).eq('video_id', video_id).eq('type', 'dislike');

        res.json({ likes, dislikes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

router.put('/:id/like', auth, (req, res) => handleLikeDislike(req, res, 'like'));
router.put('/:id/dislike', auth, (req, res) => handleLikeDislike(req, res, 'dislike'));

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { text, parentComment } = req.body;
        const { data: comment, error } = await supabase
            .from('comments')
            .insert([{
                text,
                user_id: req.user.id,
                video_id: req.params.id,
                parent_comment_id: parentComment || null
            }])
            .select(`
                *,
                _id:id,
                user:users!inner(username, avatar, _id:id)
            `)
            .single();

        if (error) throw error;
        res.status(201).json({ comment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete video
router.delete('/:id', auth, async (req, res) => {
    try {
        const { data: video } = await supabase.from('videos').select('uploader_id, channel_id').eq('id', req.params.id).single();

        if (!video) return res.status(404).json({ message: 'Video not found' });
        if (video.uploader_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        await supabase.from('videos').delete().eq('id', req.params.id);

        // Decrement channel video count
        const { data: channelData } = await supabase.from('channels').select('video_count').eq('id', video.channel_id).single();
        if (channelData && channelData.video_count > 0) {
            await supabase.from('channels').update({ video_count: channelData.video_count - 1 }).eq('id', video.channel_id);
        }

        res.json({ message: 'Video deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
