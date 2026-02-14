const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Channel name is required'],
        trim: true,
        maxlength: 50
    },
    handle: {
        type: String,
        required: [true, 'Channel handle is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^@[a-zA-Z0-9_]+$/, 'Handle must start with @ and contain only letters, numbers, and underscores']
    },
    description: {
        type: String,
        default: '',
        maxlength: 1000
    },
    avatar: {
        type: String,
        default: ''
    },
    banner: {
        type: String,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subscriberCount: {
        type: Number,
        default: 0
    },
    videoCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Channel', channelSchema);
