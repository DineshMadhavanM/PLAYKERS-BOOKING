require('dotenv').config();
console.log("Loaded SID:", process.env.TWILIO_ACCOUNT_SID); // Debug
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Import Routes
const matchRoutes = require('./routes/matches');
const playerRoutes = require('./routes/players');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Initialize Twilio client
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const COMPANY_WHATSAPP_NUMBER = 'whatsapp:+916374561199';

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://127.0.0.1:5502'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Accept', 'Content-Type', 'Authorization'],
  credentials: true
}));

// MongoDB Connection
const db = "mongodb://127.0.0.1:27017/playersBooking"; 

mongoose.connect(db, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
});

// WebSocket Connection Management
const connectedUsers = new Map(); // userId -> socket.id

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('userConnected', (userId) => {
        connectedUsers.set(userId, socket.id);
        // Update user's online status in database
        require('./models/User').findByIdAndUpdate(userId, 
            { isOnline: true, lastActivity: new Date() }
        ).catch(console.error);
    });

    socket.on('disconnect', () => {
        // Find userId by socket.id and remove from connected users
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                // Update user's online status in database
                require('./models/User').findByIdAndUpdate(userId, 
                    { isOnline: false, lastActivity: new Date() }
                ).catch(console.error);
                break;
            }
        }
    });
});

// Routes
// API Routes
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Test route for Twilio WhatsApp
app.get('/api/test-whatsapp', async (req, res) => {
    try {
        const message = await client.messages.create({
            from: COMPANY_WHATSAPP_NUMBER,
            to: 'whatsapp:+916374561199', // Your registered test number
            body: 'Hello! This is a test message from your sports booking app.'
        });
        res.json({ success: true, messageId: message.sid });
    } catch (error) {
        console.error('Twilio test error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Webhook for Twilio WhatsApp responses
// ... existing code ...

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
