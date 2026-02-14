const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

// Multer config for post images
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `post-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Create post
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.user.channel) {
            return res.status(400).json({ message: 'You need to create a channel first' });
        }

        const post = new Post({
            content: req.body.content,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
            channel: req.user.channel._id || req.user.channel,
            author: req.user._id
        });

        await post.save();
        await post.populate('author', 'username avatar');
        await post.populate('channel', 'name avatar handle');

        res.status(201).json({ message: 'Post created', post });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get posts by channel
router.get('/channel/:channelId', async (req, res) => {
    try {
        const posts = await Post.find({ channel: req.params.channelId })
            .populate('author', 'username avatar')
            .populate('channel', 'name avatar handle')
            .sort({ createdAt: -1 });
        res.json({ posts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Like post
router.put('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const likeIndex = post.likes.indexOf(req.user._id);
        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
        } else {
            post.likes.push(req.user._id);
        }
        await post.save();
        res.json({ likes: post.likes.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
