const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Search videos and channels
router.get('/', async (req, res) => {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Search videos
        const { data: videos, error: vError } = await supabase
            .from('videos')
            .select(`
                *,
                _id:id,
                channel:channels!inner(name, avatar, handle, _id:id),
                uploader:users!inner(username, avatar, _id:id)
            `)
            .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            .order('views', { ascending: false })
            .limit(20);

        // Search channels
        const { data: channels, error: cError } = await supabase
            .from('channels')
            .select(`
                *,
                _id:id,
                owner:users!inner(username, _id:id)
            `)
            .or(`name.ilike.%${searchTerm}%,handle.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            .order('subscriber_count', { ascending: false })
            .limit(10);

        if (vError || cError) throw (vError || cError);

        res.json({ videos: videos || [], channels: channels || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
