const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const videoRoutes = require('./routes/videos');
const postRoutes = require('./routes/posts');
const subscriptionRoutes = require('./routes/subscriptions');
const searchRoutes = require('./routes/search');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://yt-seven-beige.vercel.app',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route (Moved higher for better matching)
app.get('/', (req, res) => {
    const dbStatus = require('mongoose').connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected (Check Environment Variables)';
    res.send(`
        <h1>🚀 OpfFarmy API is running!</h1>
        <p>Database Status: <strong>${dbStatus}</strong></p>
        <p>Connect from your <a href="https://yt-seven-beige.vercel.app">Frontend here</a>.</p>
        ${!process.env.MONGODB_URI ? '<p style="color:red"><strong>Warning:</strong> MONGODB_URI is missing in Vercel settings!</p>' : ''}
    `);
});

// Diagnostic test route
app.get('/test', (req, res) => res.json({ message: 'Backend is reachable!' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'OpfFarmy API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof require('multer').MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 OpfFarmy API server running on port ${PORT}`);
    });
}

module.exports = app;
