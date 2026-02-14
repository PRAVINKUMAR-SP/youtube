const express = require('express'); // Deployment Trigger: V2 (Supabase)
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// const { connectDB, getLastError } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const videoRoutes = require('./routes/videos');
const postRoutes = require('./routes/posts');
const subscriptionRoutes = require('./routes/subscriptions');
const searchRoutes = require('./routes/search');

const app = express();

// Connect to MongoDB
// Connect to MongoDB - REMOVED for Supabase Migration
// connectDB();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://yt-seven-beige.vercel.app',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            // Optional: You can choose to allow all or log warning
            // For now, let's allow it to debug, or stricter:
            // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
            return callback(null, true); // Temporarily allow all for debugging if sticky issues persist, or strictly:
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route (Moved higher for better matching)
const supabase = require('./config/supabase');

// Root route (Supabase Connected)
app.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        const dbStatus = error ? '❌ Disconnected' : '✅ Connected';

        res.send(`
            <div style="font-family: sans-serif; padding: 20px;">
                <h1>🚀 OpfFarmy API is running! (Supabase Edition ⚡)</h1>
                <p>Database Status: <strong>${dbStatus}</strong></p>
                <p>Connect from your <a href="${process.env.FRONTEND_URL || '#'}">Frontend here</a>.</p>
            </div>
        `);
    } catch (err) {
        res.send(`<h1>❌ Server Error</h1><p>${err.message}</p>`);
    }
});

// Diagnostic test route
app.get('/test', (req, res) => res.json({ message: 'Backend is reachable!' }));

// Serve uploaded files
const fs = require('fs');
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath) && process.env.NODE_ENV !== 'production') {
    fs.mkdirSync(uploadsPath);
}
app.use('/uploads', express.static(uploadsPath));

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
// Render needs app.listen, Vercel does not. 
// We detect if we are NOT on Vercel to start the server normally.
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 OpfFarmy API server running on port ${PORT}`);
    });
}

module.exports = app;
