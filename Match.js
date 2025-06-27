const mongoose = require('mongoose');
const { Schema } = mongoose;

const batsmanSchema = new Schema({
    name: String,
    runs:   { type: Number, default: 0, min: 0 },
    balls:  { type: Number, default: 0, min: 0 },
    fours:  { type: Number, default: 0, min: 0 },
    sixes:  { type: Number, default: 0, min: 0 },
    status: { type: String, default: 'not out' },
    dismissal: {
        kind: String,
        bowler: String,
        fielder: String
    }
});

const bowlerSchema = new Schema({
    name:     String,
    overs:    String,
    maidens:  { type: Number, default: 0, min: 0 },
    runs:     { type: Number, default: 0, min: 0 },
    wickets:  { type: Number, default: 0, min: 0 }
});

const inningsSchema = new Schema({
    battingTeam: String,
    bowlingTeam: String,
    score: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: String,
    batsmen: [batsmanSchema],
    bowlers: [bowlerSchema]
});


const mongoose = require('mongoose');

const matchRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    matchType: {
        type: String,
        required: true,
        enum: ['T20', 'ODI', 'Test']
    },
    preferredDate: Date,
    preferredVenue: String
});

const matchSchema = new mongoose.Schema({
    // ... existing code ...
});

const Match = mongoose.model('Match', matchSchema);
const MatchRequest = mongoose.model('MatchRequest', matchRequestSchema);

module.exports = { Match, MatchRequest };