const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// Subscribe / Unsubscribe toggle
router.post('/:channelId', auth, async (req, res) => {
    try {
        const channel_id = req.params.channelId;
        const subscriber_id = req.user.id;

        // Check if channel exists
        const { data: channel, error: chError } = await supabase.from('channels').select('*').eq('id', channel_id).single();
        if (chError || !channel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        // Can't subscribe to your own channel
        if (channel.owner_id === subscriber_id) {
            return res.status(400).json({ message: 'Cannot subscribe to your own channel' });
        }

        const { data: existing } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('subscriber_id', subscriber_id)
            .eq('channel_id', channel_id)
            .single();

        let subscribed = false;
        let newCount = channel.subscriber_count;

        if (existing) {
            // Unsubscribe
            await supabase.from('subscriptions').delete().eq('id', existing.id);
            newCount = Math.max(0, channel.subscriber_count - 1);
            await supabase.from('channels').update({ subscriber_count: newCount }).eq('id', channel_id);
            subscribed = false;
        } else {
            // Subscribe
            await supabase.from('subscriptions').insert([{ subscriber_id, channel_id }]);
            newCount = channel.subscriber_count + 1;
            await supabase.from('channels').update({ subscriber_count: newCount }).eq('id', channel_id);
            subscribed = true;
        }

        res.json({ subscribed, subscriberCount: newCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's subscriptions
router.get('/', auth, async (req, res) => {
    try {
        const { data: subs, error } = await supabase
            .from('subscriptions')
            .select(`
                channel:channels!inner(name, avatar, handle, subscriber_count, _id:id)
            `)
            .eq('subscriber_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ subscriptions: subs.map(s => s.channel) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Check if user is subscribed to a channel
router.get('/check/:channelId', auth, async (req, res) => {
    try {
        const { data: sub } = await supabase.from('subscriptions')
            .select('id')
            .eq('subscriber_id', req.user.id)
            .eq('channel_id', req.params.channelId)
            .single();

        res.json({ subscribed: !!sub });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
