const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const connectDB = require('./config/database');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5502;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all localhost and 127.0.0.1 origins
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        
        // Allow specific origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:5502',
            'http://localhost:5502',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:5504'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
connectDB();

// Debug route to catch all requests (at the beginning)
app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.url}`);
    next();
});

// Function to store or update user in MongoDB
async function storeUser(userData) {
    try {
        const existingUser = await User.findOne({ 
            $or: [
                { email: userData.email },
                { googleId: userData.googleId }
            ]
        });

        if (existingUser) {
            // Update existing user
            existingUser.lastLogin = new Date();
            await existingUser.save();
            console.log(`✅ User logged in: ${userData.email}`);
            return existingUser;
        } else {
            // Create new user
            const newUser = new User({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                googleId: userData.googleId,
                picture: userData.picture,
                dateOfBirth: userData.dateOfBirth,
                place: userData.place,
                source: userData.googleId ? 'google' : 'email'
            });
            await newUser.save();
            console.log(`✅ New user signed up: ${userData.email}`);
            return newUser;
        }
    } catch (error) {
        console.error('❌ Error storing user:', error.message);
        throw error;
    }
}

// Passport configuration
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5502/auth/google/callback"
    }, async function(accessToken, refreshToken, profile, cb) {
        try {
            // Create user object from Google profile
            const userData = {
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                picture: profile.photos[0]?.value
            };
            
            // Store user in MongoDB
            const user = await storeUser(userData);
            
            return cb(null, user);
        } catch (error) {
            console.error('Google OAuth error:', error);
            return cb(error, null);
        }
    }));
} else {
    console.log('⚠️  Google OAuth credentials not found. Using demo mode.');
    console.log('📝 To set up real Google OAuth:');
    console.log('   1. Create a .env file in the project root');
    console.log('   2. Add: GOOGLE_CLIENT_ID=your-client-id');
    console.log('   3. Add: GOOGLE_CLIENT_SECRET=your-client-secret');
    console.log('   4. Restart the server');
}

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Routes

// Handle GET requests to /api/register (method not allowed)
app.get('/api/register', (req, res) => {
    console.log('❌ GET request to /api/register - Method not allowed');
    res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST for registration.'
    });
});

// Handle GET requests to /api/login (method not allowed)
app.get('/api/login', (req, res) => {
    console.log('❌ GET request to /api/login - Method not allowed');
    res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST for login.'
    });
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (user && user.password === password) {
            // Update last login time
            await user.updateLastLogin();
            
            res.json({
                success: true,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});

app.post('/api/register', async (req, res) => {
    console.log('🔍 Registration endpoint hit');
    console.log('📝 Request method:', req.method);
    console.log('📝 Request body:', req.body);
    try {
        const { name, email, password, dob, place } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        
        // Create new user
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            dateOfBirth: dob,
            place,
            source: 'email'
        });
        
        await newUser.save();
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: newUser._id
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        });
    }
});

// Handle GET requests to /api/availabilities (method not allowed)
app.get('/api/availabilities', (req, res) => {
    console.log('❌ GET request to /api/availabilities - Method not allowed');
    res.status(405).json({
        success: false,
        error: 'Method not allowed. Use POST for setting availability.'
    });
});

// Store availability data in memory (in production, use database)
let availabilities = [];

// Availability route
app.post('/api/availabilities', async (req, res) => {
    try {
        const availabilityData = req.body;
        
        // Add timestamp and unique ID
        const availability = {
            ...availabilityData,
            _id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        
        // Store in memory array
        availabilities.push(availability);
        
        console.log('Availability data received:', availabilityData);
        
        res.json({
            success: true,
            message: 'Availability saved successfully',
            data: availability
        });
    } catch (error) {
        console.error('Error saving availability:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while saving availability'
        });
    }
});

// Get availabilities with filtering
app.get('/api/availabilities', async (req, res) => {
    try {
        let filteredAvailabilities = [...availabilities];
        
        // Filter by matchAvailable (for find-a-match.html)
        if (req.query.matchAvailable === 'true') {
            filteredAvailabilities = filteredAvailabilities.filter(a => a.matchAvailable === 'yes');
        }
        
        // Filter by playerAvailable (for find-a-player.html)
        if (req.query.playerAvailable === 'true') {
            filteredAvailabilities = filteredAvailabilities.filter(a => a.playerAvailable === 'yes');
        }
        
        // Filter by game type
        if (req.query.gameType) {
            filteredAvailabilities = filteredAvailabilities.filter(a => 
                a.gameType === req.query.gameType
            );
        }
        
        // Filter by place
        if (req.query.place) {
            filteredAvailabilities = filteredAvailabilities.filter(a => 
                a.place === req.query.place
            );
        }
        
        // Filter by landmark
        if (req.query.landmark) {
            filteredAvailabilities = filteredAvailabilities.filter(a => 
                a.landmark && a.landmark.toLowerCase().includes(req.query.landmark.toLowerCase())
            );
        }
        
        // Filter by date
        if (req.query.date) {
            filteredAvailabilities = filteredAvailabilities.filter(a => 
                a.date === req.query.date
            );
        }
        
        res.json(filteredAvailabilities);
    } catch (error) {
        console.error('Error fetching availabilities:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching availabilities'
        });
    }
});

// Store messages in memory (in production, use database)
let messages = [];

// Messages API endpoint
app.post('/api/messages', async (req, res) => {
    try {
        const messageData = req.body;
        
        // Add timestamp and unique ID
        const message = {
            ...messageData,
            _id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        
        // Store in memory array
        messages.push(message);
        
        console.log('Message received:', messageData);
        
        res.json({
            success: true,
            message: 'Request sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while sending message'
        });
    }
});

// Get messages (for admin panel or user dashboard)
app.get('/api/messages', async (req, res) => {
    try {
        let filteredMessages = [...messages];
        
        // Filter by receiver ID if provided
        if (req.query.receiverId) {
            filteredMessages = filteredMessages.filter(m => m.receiverId === req.query.receiverId);
        }
        
        // Filter by sender name if provided
        if (req.query.senderName) {
            filteredMessages = filteredMessages.filter(m => 
                m.senderName.toLowerCase().includes(req.query.senderName.toLowerCase())
            );
        }
        
        res.json(filteredMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching messages'
        });
    }
});

// E-commerce Products API
// Store products in memory (in production, use database)
let products = [
    {
        id: 1,
        name: 'Premium Cricket Bat',
        price: 2999,
        rating: 4.5,
        image: '🏏',
        category: 'cricket',
        description: 'Professional grade cricket bat with excellent balance and power',
        inStock: true,
        badge: 'Best Seller',
        featured: true
    },
    {
        id: 2,
        name: 'Professional Football',
        price: 1499,
        rating: 4.3,
        image: '⚽',
        category: 'football',
        description: 'FIFA approved professional football for competitive play',
        inStock: true,
        featured: true
    },
    {
        id: 3,
        name: 'Basketball Court Ball',
        price: 899,
        rating: 4.7,
        image: '🏀',
        category: 'basketball',
        description: 'Official size basketball for indoor and outdoor courts',
        inStock: true,
        badge: 'Popular',
        featured: true
    },
    {
        id: 4,
        name: 'Tennis Racket Pro',
        price: 2499,
        rating: 4.6,
        image: '🎾',
        category: 'tennis',
        description: 'Professional tennis racket with excellent control and power',
        inStock: true,
        featured: true
    },
    {
        id: 5,
        name: 'Cricket Ball Leather',
        price: 399,
        rating: 4.2,
        image: '🏏',
        category: 'cricket',
        description: 'Premium leather cricket ball for professional matches',
        inStock: true
    },
    {
        id: 6,
        name: 'Football Cleats',
        price: 1999,
        rating: 4.4,
        image: '⚽',
        category: 'football',
        description: 'Professional football cleats with excellent grip and comfort',
        inStock: true
    },
    {
        id: 7,
        name: 'Basketball Hoop',
        price: 4999,
        rating: 4.8,
        image: '🏀',
        category: 'basketball',
        description: 'Adjustable basketball hoop for home and professional use',
        inStock: true,
        badge: 'New'
    },
    {
        id: 8,
        name: 'Tennis Balls Pack',
        price: 299,
        rating: 4.1,
        image: '🎾',
        category: 'tennis',
        description: 'Pack of 3 premium tennis balls for practice and matches',
        inStock: true
    },
    {
        id: 9,
        name: 'Dumbbells Set',
        price: 3499,
        rating: 4.6,
        image: '🏋️',
        category: 'fitness',
        description: 'Adjustable dumbbells set for home and gym workouts',
        inStock: true
    },
    {
        id: 10,
        name: 'Yoga Mat Premium',
        price: 799,
        rating: 4.3,
        image: '🧘',
        category: 'fitness',
        description: 'Non-slip yoga mat for yoga and fitness activities',
        inStock: true
    },
    {
        id: 11,
        name: 'Sports Bag Large',
        price: 1299,
        rating: 4.5,
        image: '🎒',
        category: 'accessories',
        description: 'Large sports bag with multiple compartments for all equipment',
        inStock: true
    },
    {
        id: 12,
        name: 'Water Bottle Insulated',
        price: 599,
        rating: 4.7,
        image: '💧',
        category: 'accessories',
        description: 'Insulated water bottle to keep drinks cold for hours',
        inStock: true,
        badge: 'Best Seller'
    }
];

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        let filteredProducts = [...products];
        
        // Filter by category
        if (req.query.category) {
            filteredProducts = filteredProducts.filter(p => p.category === req.query.category);
        }
        
        // Filter by search term
        if (req.query.search) {
            const searchTerm = req.query.search.toLowerCase();
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter by price range
        if (req.query.minPrice) {
            filteredProducts = filteredProducts.filter(p => p.price >= parseInt(req.query.minPrice));
        }
        if (req.query.maxPrice) {
            filteredProducts = filteredProducts.filter(p => p.price <= parseInt(req.query.maxPrice));
        }
        
        // Filter by rating
        if (req.query.minRating) {
            filteredProducts = filteredProducts.filter(p => p.rating >= parseFloat(req.query.minRating));
        }
        
        // Sort products
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'name':
                    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'price-low':
                    filteredProducts.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    filteredProducts.sort((a, b) => b.price - a.price);
                    break;
                case 'rating':
                    filteredProducts.sort((a, b) => b.rating - a.rating);
                    break;
                case 'newest':
                    filteredProducts.sort((a, b) => b.id - a.id);
                    break;
            }
        }
        
        res.json(filteredProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching products'
        });
    }
});

// Get featured products
app.get('/api/products/featured', async (req, res) => {
    try {
        const featuredProducts = products.filter(p => p.featured);
        res.json(featuredProducts);
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching featured products'
        });
    }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const product = products.find(p => p.id === productId);
        
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching product'
        });
    }
});

// Store orders in memory (in production, use database)
let orders = [];

// Create order
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Add timestamp and unique ID
        const order = {
            ...orderData,
            _id: Date.now().toString(),
            orderId: `ORD${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        // Store in memory array
        orders.push(order);
        
        console.log('Order created:', order.orderId);
        
        res.json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while creating order'
        });
    }
});

// Get orders
app.get('/api/orders', async (req, res) => {
    try {
        let filteredOrders = [...orders];
        
        // Filter by email if provided
        if (req.query.email) {
            filteredOrders = filteredOrders.filter(o => o.shipping.email === req.query.email);
        }
        
        // Filter by status if provided
        if (req.query.status) {
            filteredOrders = filteredOrders.filter(o => o.status === req.query.status);
        }
        
        res.json(filteredOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching orders'
        });
    }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = orders.find(o => o._id === orderId || o.orderId === orderId);
        
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching order'
        });
    }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        
        const order = orders.find(o => o._id === orderId || o.orderId === orderId);
        
        if (order) {
            order.status = status;
            order.updatedAt = new Date().toISOString();
            
            res.json({
                success: true,
                message: 'Order status updated successfully',
                data: order
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while updating order status'
        });
    }
});

// Google OAuth routes
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here') {
    app.get('/auth/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/login.html' }),
        function(req, res) {
            // Successful authentication, redirect to home page
            res.redirect('/index.html');
        }
    );
} else {
    // Demo mode - simulate Google OAuth for development
    app.get('/auth/google', (req, res) => {
        // Redirect to a demo Google sign-in page
        res.redirect('/demo-google-auth.html');
    });
    
    app.get('/auth/google/callback', async (req, res) => {
        try {
            // Create a demo user
            const demoUserData = {
                name: 'Demo Google User',
                email: 'demo@gmail.com',
                googleId: 'demo_google_user',
                picture: null
            };
            
            // Store the demo user in MongoDB
            await storeUser(demoUserData);
            
            // Redirect to home page
            res.redirect('/index.html?demo=true');
        } catch (error) {
            console.error('Demo OAuth error:', error);
            res.redirect('/login.html?error=demo_failed');
        }
    });
}

// API endpoint to get all users (for admin panel)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password') // Exclude password from response
            .sort({ createdAt: -1 }); // Sort by newest first
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Server error while fetching users'
        });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/admin-panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-connection.html'));
});

app.get('/test-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-admin.html'));
});

app.get('/test-register', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-register.html'));
});

app.get('/debug-api', (req, res) => {
    res.sendFile(path.join(__dirname, 'debug-api.html'));
});

app.get('/test-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-simple.html'));
});

// Static file serving - moved after API routes
app.use(express.static(path.join(__dirname)));

// 404 handler for API routes that don't exist
app.use('/api/*', (req, res) => {
    console.log(`❌ API route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Google OAuth routes:');
    console.log(`- GET /auth/google (initiate OAuth)`);
    console.log(`- GET /auth/google/callback (OAuth callback)`);
    console.log(`- Admin Panel: http://localhost:${PORT}/admin-panel`);
});