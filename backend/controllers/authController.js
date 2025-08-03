const crypto = require('crypto');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');
const asyncHandler = require('express-async-handler');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user / Send OTP
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, password, phone } = req.body;
    const email = req.body.email.toLowerCase();
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
        res.status(400);
        throw new Error('User already exists');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (user) {
        user.name = name;
        user.password = password;
        user.phone = phone;
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();
    } else {
        user = await User.create({ name, email, password, phone, otp, otpExpires });
    }

    await sendEmail({
        email: user.email,
        subject: 'Your OTP for MegaBasket Registration',
        message: `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
    });

    res.status(200).json({ message: 'OTP sent to your email. Please verify.' });
});

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });

    if (!user) {
        res.status(400);
        throw new Error('Invalid OTP or OTP has expired.');
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        addresses: user.addresses,
        token: generateToken(user._id),
    });
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email });
    if (user && user.isVerified && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
            addresses: user.addresses,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password, or user not verified.');
    }
});

// @desc    Auth admin & get token
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email });
    if (user && user.role === 'Admin' && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin.');
    }
});

// @desc    Google OAuth
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const name = payload.name;
    const email = payload.email.toLowerCase();
    const picture = payload.picture;

    let user = await User.findOne({ email });
    if (user) {
        if (!user.googleId) {
            user.googleId = payload.sub;
            user.profilePicture = user.profilePicture || picture;
            user.isVerified = true;
            await user.save();
        }
    } else {
        user = await User.create({
            name,
            email,
            googleId: payload.sub,
            profilePicture: picture,
            isVerified: true,
        });
    }
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        addresses: user.addresses,
        token: generateToken(user._id),
    });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `<p>You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a><p>If you did not request this, please ignore this email.</p>`;

    await sendEmail({ email: user.email, subject: 'Password Reset Request', message });

    res.status(200).json({ message: 'Email sent with password reset instructions.' });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const passwordResetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired token');
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful.' });
});

module.exports = { registerUser, verifyOtp, loginUser, loginAdmin, googleAuth, forgotPassword, resetPassword };
