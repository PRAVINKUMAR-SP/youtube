const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Video = require('../models/Video');
const Channel = require('../models/Channel');
const Comment = require('../models/Comment');
const { auth, optionalAuth } = require('../middleware/auth');

// Multer config for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `video-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'video') {
            const videoTypes = /mp4|avi|mov|mkv|webm/;
            const extname = videoTypes.test(path.extname(file.originalname).toLowerCase());
            if (extname) return cb(null, true);
            cb(new Error('Only video files are allowed'));
        } else if (file.fieldname === 'thumbnail') {
            const imageTypes = /jpeg|jpg|png|webp/;
            const extname = imageTypes.test(path.extname(file.originalname).toLowerCase());
            if (extname) return cb(null, true);
            cb(new Error('Only image files are allowed for thumbnails'));
        } else {
            cb(null, true);
        }
    }
});

// Upload video
router.post('/', auth, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.user.channel) {
            return res.status(400).json({ message: 'You need to create a channel first' });
        }

        if (!req.files?.video?.[0]) {
            return res.status(400).json({ message: 'Video file is required' });
        }

        const { title, description, category, tags, duration } = req.body;

        const video = new Video({
            title,
            description,
            videoUrl: `/uploads/${req.files.video[0].filename}`,
            thumbnailUrl: req.files?.thumbnail?.[0] ? `/uploads/${req.files.thumbnail[0].filename}` : '',
            channel: req.user.channel._id || req.user.channel,
            uploader: req.user._id,
            category: category || 'Other',
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            duration: duration || '0:00'
        });

        await video.save();

        // Increment video count on channel
        await Channel.findByIdAndUpdate(video.channel, { $inc: { videoCount: 1 } });

        res.status(201).json({ message: 'Video uploaded successfully', video });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all videos (with pagination and filtering)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const category = req.query.category;
        const sort = req.query.sort || 'newest';

        const query = {};
        if (category && category !== 'All') query.category = category;

        let sortOption = {};
        switch (sort) {
            case 'popular': sortOption = { views: -1 }; break;
            case 'oldest': sortOption = { createdAt: 1 }; break;
            default: sortOption = { createdAt: -1 };
        }

        const videos = await Video.find(query)
            .populate({ path: 'channel', select: 'name avatar handle' })
            .populate('uploader', 'username avatar')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Video.countDocuments(query);

        res.json({
            videos,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single video
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const video = await Video.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate({ path: 'channel', select: 'name avatar handle subscriberCount' })
            .populate('uploader', 'username avatar');

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Get comments
        const comments = await Comment.find({ video: video._id })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ video, comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get videos by channel
router.get('/channel/:channelId', async (req, res) => {
    try {
        const videos = await Video.find({ channel: req.params.channelId })
            .populate({ path: 'channel', select: 'name avatar handle' })
            .sort({ createdAt: -1 });
        res.json({ videos });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Like video
router.put('/:id/like', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        const userId = req.user._id;
        const likeIndex = video.likes.indexOf(userId);
        const dislikeIndex = video.dislikes.indexOf(userId);

        if (likeIndex > -1) {
            video.likes.splice(likeIndex, 1); // Un-like
        } else {
            video.likes.push(userId);
            if (dislikeIndex > -1) video.dislikes.splice(dislikeIndex, 1); // Remove dislike
        }

        await video.save();
        res.json({ likes: video.likes.length, dislikes: video.dislikes.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Dislike video
router.put('/:id/dislike', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        const userId = req.user._id;
        const dislikeIndex = video.dislikes.indexOf(userId);
        const likeIndex = video.likes.indexOf(userId);

        if (dislikeIndex > -1) {
            video.dislikes.splice(dislikeIndex, 1);
        } else {
            video.dislikes.push(userId);
            if (likeIndex > -1) video.likes.splice(likeIndex, 1);
        }

        await video.save();
        res.json({ likes: video.likes.length, dislikes: video.dislikes.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { text, parentComment } = req.body;
        const comment = new Comment({
            text,
            user: req.user._id,
            video: req.params.id,
            parentComment: parentComment || null
        });
        await comment.save();
        await comment.populate('user', 'username avatar');
        res.status(201).json({ comment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete video
router.delete('/:id', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });
        if (video.uploader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Video.findByIdAndDelete(req.params.id);
        await Comment.deleteMany({ video: req.params.id });
        await Channel.findByIdAndUpdate(video.channel, { $inc: { videoCount: -1 } });

        res.json({ message: 'Video deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
