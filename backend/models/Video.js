const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Video title is required'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        default: '',
        maxlength: 5000
    },
    videoUrl: {
        type: String,
        required: [true, 'Video file is required']
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    duration: {
        type: String,
        default: '0:00'
    },
    category: {
        type: String,
        enum: ['Music', 'Gaming', 'Education', 'Entertainment', 'Sports', 'News', 'Technology', 'Comedy', 'Vlogs', 'Other'],
        default: 'Other'
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for search
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Video', videoSchema);
