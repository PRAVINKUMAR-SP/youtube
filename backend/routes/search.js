const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Channel = require('../models/Channel');

// Search videos and channels
router.get('/', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = new RegExp(query, 'i');

        // Search videos
        const videos = await Video.find({
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
            ]
        })
            .populate({ path: 'channel', select: 'name avatar handle' })
            .populate('uploader', 'username avatar')
            .sort({ views: -1 })
            .limit(20);

        // Search channels
        const channels = await Channel.find({
            $or: [
                { name: searchRegex },
                { handle: searchRegex },
                { description: searchRegex }
            ]
        })
            .populate('owner', 'username')
            .sort({ subscriberCount: -1 })
            .limit(10);

        res.json({ videos, channels });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
