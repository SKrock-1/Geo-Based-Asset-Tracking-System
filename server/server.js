const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io with CORS support
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Store io instance for use in controllers
app.set('io', io);

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/geo_asset_tracker')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Socket.io Connection Handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle client disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });

    // Optional: Handle room subscriptions for specific assets
    socket.on('subscribe:asset', (assetId) => {
        socket.join(`asset:${assetId}`);
        console.log(`Socket ${socket.id} subscribed to asset:${assetId}`);
    });

    socket.on('unsubscribe:asset', (assetId) => {
        socket.leave(`asset:${assetId}`);
        console.log(`Socket ${socket.id} unsubscribed from asset:${assetId}`);
    });
});

// Routes (Placeholder)
app.get('/', (req, res) => {
    res.send('Geo-Based Asset Tracking API is running...');
});

// APIs
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Use server.listen instead of app.listen for Socket.io
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
