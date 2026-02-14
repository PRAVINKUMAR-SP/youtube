const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('channel');

        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// Optional auth - doesn't fail if no token, but attaches user if present
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).populate('channel');
            if (user) req.user = user;
        }
    } catch (error) {
        // Silently continue without auth
    }
    next();
};

module.exports = { auth, optionalAuth };
