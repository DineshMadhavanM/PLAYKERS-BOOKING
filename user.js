require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userStatsSchema = new mongoose.Schema({
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    recent: [{ type: String }] // Stores summary of last 5 matches
});

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    whatsappNumber: {
        type: String,
        trim: true
    },
    dob: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    userStats: {
        type: userStatsSchema,
        default: () => ({})
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Friend'
    }]
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last activity
UserSchema.methods.updateActivity = function() {
    this.lastActivity = new Date();
    return this.save();
};

// Method to check if user is online (active in last 5 minutes)
UserSchema.methods.checkOnlineStatus = function() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastActivity > fiveMinutesAgo;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;