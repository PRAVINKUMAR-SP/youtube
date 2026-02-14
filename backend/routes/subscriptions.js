const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Channel = require('../models/Channel');
const { auth } = require('../middleware/auth');

// Subscribe / Unsubscribe toggle
router.post('/:channelId', auth, async (req, res) => {
    try {
        const channelId = req.params.channelId;
        const userId = req.user._id;

        // Check if channel exists
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        // Can't subscribe to your own channel
        if (channel.owner.toString() === userId.toString()) {
            return res.status(400).json({ message: 'Cannot subscribe to your own channel' });
        }

        const existing = await Subscription.findOne({ subscriber: userId, channel: channelId });

        if (existing) {
            // Unsubscribe
            await Subscription.findByIdAndDelete(existing._id);
            await Channel.findByIdAndUpdate(channelId, { $inc: { subscriberCount: -1 } });
            res.json({ subscribed: false, subscriberCount: channel.subscriberCount - 1 });
        } else {
            // Subscribe
            const sub = new Subscription({ subscriber: userId, channel: channelId });
            await sub.save();
            await Channel.findByIdAndUpdate(channelId, { $inc: { subscriberCount: 1 } });
            res.json({ subscribed: true, subscriberCount: channel.subscriberCount + 1 });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's subscriptions
router.get('/', auth, async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ subscriber: req.user._id })
            .populate({
                path: 'channel',
                select: 'name avatar handle subscriberCount'
            })
            .sort({ createdAt: -1 });
        res.json({ subscriptions: subscriptions.map(s => s.channel) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Check if user is subscribed to a channel
router.get('/check/:channelId', auth, async (req, res) => {
    try {
        const sub = await Subscription.findOne({
            subscriber: req.user._id,
            channel: req.params.channelId
        });
        res.json({ subscribed: !!sub });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
