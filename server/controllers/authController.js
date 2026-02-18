const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const jwt = require('jsonwebtoken');

const asyncHandler = require('express-async-handler');

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, password } = req.body;
    const email = req.body.email.toLowerCase();
    console.log(`[DEBUG] registerUser hit for email: ${email}`);

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            _id: user._id,
            email: user.email,
            accessToken,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const email = req.body.email.toLowerCase();

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        const accessToken = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            _id: user._id,
            email: user.email,
            accessToken,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Refresh access token
// @route   POST /auth/refresh
// @access  Public
const refresh = asyncHandler(async (req, res) => {
    const cookies = req.cookies;

    if (!cookies?.jwt) {
        res.status(401);
        throw new Error('Unauthorized');
    }

    const refreshToken = cookies.jwt;

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const foundUser = await User.findById(decoded.id);

        if (!foundUser) {
            res.status(401);
            throw new Error('Unauthorized');
        }

        const accessToken = generateToken(foundUser._id);

        res.json({
            accessToken,
            user: {
                _id: foundUser._id,
                email: foundUser.email,
                name: foundUser.name,
                nutritionProfile: foundUser.nutritionProfile
            }
        });
    } catch (err) {
        res.status(403);
        throw new Error('Forbidden');
    }
});

// @desc    Logout user
// @route   POST /auth/logout
// @access  Public
const logout = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV !== 'development' });
    res.json({ message: 'Cookie cleared' });
};

// @desc    Get current user profile
// @route   GET /auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
    }
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.json({
            _id: user._id,
            name: user.name || 'Anonymous',
            email: user.email,
            nutritionProfile: user.nutritionProfile,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;

        if (req.body.nutritionProfile) {
            user.nutritionProfile = {
                ...user.nutritionProfile,
                ...req.body.nutritionProfile
            };
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name || 'Anonymous',
            email: updatedUser.email,
            nutritionProfile: updatedUser.nutritionProfile,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    registerUser,
    loginUser,
    refresh,
    logout,
    getMe,
    updateProfile,
};
