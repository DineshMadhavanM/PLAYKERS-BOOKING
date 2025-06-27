const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    whatsappMessageId: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Compound index to prevent duplicate friend requests
FriendSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const Friend = mongoose.model('Friend', FriendSchema);

module.exports = Friend;