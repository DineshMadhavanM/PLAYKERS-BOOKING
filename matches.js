const express = require('express');
const router = express.Router();

const { Match, MatchRequest } = require('../models/Match');
const Player = require('../models/Player');
const User = require('../models/User');

// New route for match requests
router.post('/request', async (req, res) => {
    try {
        const { userId, matchType, preferredDate, preferredVenue } = req.body;

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create match request
        const matchRequest = new MatchRequest({
            userId,
            matchType,
            preferredDate,
            preferredVenue
        });

        await matchRequest.save();

        res.status(201).json({
            message: 'Match request created successfully',
            request: matchRequest
        });
    } catch (error) {
        console.error('Error creating match request:', error);
        res.status(500).json({ message: 'Error creating match request', error: error.message });
    }
});

// Get all match requests
router.get('/requests', async (req, res) => {
    try {
        const requests = await MatchRequest.find()
            .populate('userId', 'username email phoneNumber')
            .sort({ requestedAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching match requests:', error);
        res.status(500).json({ message: 'Error fetching match requests', error: error.message });
    }
});

// Update match request status
router.patch('/request/:requestId', async (req, res) => {
    try {
        const { status } = req.body;
        const request = await MatchRequest.findByIdAndUpdate(
            req.params.requestId,
            { status },
            { new: true }
        ).populate('userId', 'username email phoneNumber');

        if (!request) {
            return res.status(404).json({ message: 'Match request not found' });
        }

        res.json(request);
    } catch (error) {
        console.error('Error updating match request:', error);
        res.status(500).json({ message: 'Error updating match request', error: error.message });
    }
});

// ... existing routes ...

module.exports = router;
