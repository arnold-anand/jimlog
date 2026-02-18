const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5001; // Changed from 5000 to avoid macOS AirPlay conflict

// Trust Proxy (Required for Next.js Rewrites/Proxy)
app.set('trust proxy', 1);

// Request Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} [Origin: ${req.headers.origin}]`);
    next();
});

// Middleware
app.use(cors({
    origin: true, // Reflect origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());
// app.use(helmet()); // Temporarily disable helmet to debug 403
app.use(morgan('dev'));

// Debug Middleware to trace request
app.use((req, res, next) => {
    console.log(`[DEBUG] Received ${req.method} request to ${req.originalUrl}`);
    console.log(`[DEBUG] Headers:`, JSON.stringify(req.headers));
    console.log(`[DEBUG] Body:`, JSON.stringify(req.body));
    next();
});

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', require('./routes/exerciseRoutes'));
app.use('/api/routines', require('./routes/routineRoutes'));
app.use('/api/workouts', require('./routes/workoutRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/nutrition', require('./routes/nutritionRoutes'));

app.get('/', (req, res) => {
    res.send('Gym Tracker API Running');
});

// Error Handler Middleware (MUST be last)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    console.error('[ERROR]', err.message, err.stack);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
