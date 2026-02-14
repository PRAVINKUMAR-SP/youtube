const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from Supabase
        // We use potential foreign key alias if needed, or just let Supabase detect.
        // Given circular ref, we might need to rely on the column 'channel_id' to fetch channel independently 
        // or try the relational join. For simplicity/robustness, let's fetch user first.
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                _id:id,
                channel:channels!fk_user_channel(*, _id:id)
            `)
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// Optional auth - doesn't fail if no token, but attaches user if present
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const { data: user } = await supabase
                .from('users')
                .select(`
                    *,
                    _id:id,
                    channel:channels!fk_user_channel(*, _id:id)
                `)
                .eq('id', decoded.userId)
                .single();

            if (user) req.user = user;
        }
    } catch (error) {
        // Silently continue without auth
    }
    next();
};

module.exports = { auth, optionalAuth };
