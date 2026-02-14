const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Need to import bcrypt explicitly now
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('email, username')
            .or(`email.eq.${email},username.eq.${username}`)
            .single();

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create User
        // Note: We leave channel_id null initially
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([{
                username,
                email,
                password: hashedPassword,
                avatar: `https://ui-avatars.com/api/?name=${username}&background=random`
            }])
            .select()
            .single();

        if (userError) throw userError;

        // 4. Create Default Channel for User
        const { data: newChannel, error: channelError } = await supabase
            .from('channels')
            .insert([{
                name: username,
                handle: `@${username}`,
                owner_id: newUser.id,
                avatar: newUser.avatar
            }])
            .select()
            .single();

        if (channelError) {
            // Rollback user creation if channel fails (simple manual rollback)
            await supabase.from('users').delete().eq('id', newUser.id);
            throw channelError;
        }

        // 5. Link Channel back to User
        await supabase
            .from('users')
            .update({ channel_id: newChannel.id })
            .eq('id', newUser.id);

        // 6. Generate Token
        const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                _id: newUser.id, // Keep _id for frontend compatibility if needed, or switch to id
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                avatar: newUser.avatar,
                channel: newChannel
            }
        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find User
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                channel:channels!fk_user_channel(*)
            `)
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 2. Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 3. Generate Token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                _id: user.id,
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                channel: user.channel
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        // req.user is already attached by auth middleware
        const user = req.user;
        res.json({
            user: {
                _id: user.id,
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                channel: user.channel
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
