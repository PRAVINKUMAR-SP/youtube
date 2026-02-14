const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Channel = require('../models/Channel');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Multer config for channel images
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `channel-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Create channel
router.post('/', auth, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]), async (req, res) => {
    try {
        // Check if user already has a channel
        if (req.user.channel) {
            return res.status(400).json({ message: 'You already have a channel' });
        }

        const { name, handle, description } = req.body;

        const channel = new Channel({
            name,
            handle: handle.startsWith('@') ? handle : `@${handle}`,
            description,
            owner: req.user._id,
            avatar: req.files?.avatar?.[0] ? `/uploads/${req.files.avatar[0].filename}` : '',
            banner: req.files?.banner?.[0] ? `/uploads/${req.files.banner[0].filename}` : ''
        });

        await channel.save();

        // Update user with channel reference
        await User.findByIdAndUpdate(req.user._id, { channel: channel._id });

        res.status(201).json({ message: 'Channel created successfully', channel });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Channel handle already taken' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Get channel by ID
router.get('/:id', async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id).populate('owner', 'username avatar');
        if (!channel) {
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
        const channels = await Channel.find()
            .populate('owner', 'username avatar')
            .sort({ subscriberCount: -1 })
            .limit(20);
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
        const channel = await Channel.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }
        if (channel.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updates = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.body.description) updates.description = req.body.description;
        if (req.files?.avatar?.[0]) updates.avatar = `/uploads/${req.files.avatar[0].filename}`;
        if (req.files?.banner?.[0]) updates.banner = `/uploads/${req.files.banner[0].filename}`;

        const updatedChannel = await Channel.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json({ message: 'Channel updated', channel: updatedChannel });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
