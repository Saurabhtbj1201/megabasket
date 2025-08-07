const crypto = require('crypto');
const User = require('../models/userModel');
const Product = require('../models/productModel');
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

    // Enhanced OTP Email Template
    const otpMessage = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your MegaBasket Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333333; background-color: #f9f9f9;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4CAF50, #2E8B57); padding: 30px 20px; text-align: center;">
                <img src="${process.env.FRONTEND_URL}/logo.png" alt="MegaBasket Logo" style="max-height: 60px; margin-bottom: 10px;">
                <h1 style="color: white; margin: 0; font-size: 24px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Verify Your Account</h1>
            </div>
            
            <!-- Content -->
            <div style="max-width: 600px; margin: 0 auto; padding: 30px 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: -20px; position: relative;">
                <p style="font-size: 16px; line-height: 1.6; color: #444;">Hi ${name},</p>
                <p style="font-size: 16px; line-height: 1.6; color: #444;">Welcome to MegaBasket! Please use the verification code below to complete your registration.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; background-color: #f5f5f5; padding: 15px; border-radius: 8px; color: #333; display: inline-block; min-width: 200px; border: 1px dashed #ccc;">
                        ${otp}
                    </div>
                    <p style="font-size: 14px; color: #666; margin-top: 15px;">This code will expire in 10 minutes.</p>
                </div>
                
                <div style="background-color: #f5f9f5; border-left: 4px solid #4CAF50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #333333; font-size: 14px;">If you didn't request this verification code, please ignore this email or contact our support team if you have concerns about your account security.</p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; color: #444;">We're excited to have you join our community!</p>
            </div>
            
            <!-- Footer -->
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; color: #777777; font-size: 12px;">
                <p style="margin-bottom: 10px;">© ${new Date().getFullYear()} MegaBasket. All rights reserved.</p>
                <div style="margin-bottom: 15px;">
                    <a href="${process.env.FRONTEND_URL}/contact" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Contact Us</a> |
                    <a href="${process.env.FRONTEND_URL}/faq" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">FAQs</a> |
                    <a href="${process.env.FRONTEND_URL}/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms & Conditions</a> |
                    <a href="${process.env.FRONTEND_URL}/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                </div>
                <div style="margin-bottom: 15px;">
                    <a href="https://facebook.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/facebook.png" alt="Facebook" style="width: 24px; height: 24px;"></a>
                    <a href="https://twitter.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/twitter.png" alt="Twitter" style="width: 24px; height: 24px;"></a>
                    <a href="https://instagram.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/instagram.png" alt="Instagram" style="width: 24px; height: 24px;"></a>
                </div>
                <p style="font-size: 11px; color: #999;">If you have any questions, please contact our customer service team at <a href="mailto:support@megabasket.com" style="color: #4CAF50;">support@megabasket.com</a></p>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        email: user.email,
        subject: 'Your MegaBasket Verification Code',
        message: otpMessage,
    });

    res.status(200).json({ message: 'OTP sent to your email. Please verify.' });
});

// Helper function to send welcome email
const sendWelcomeEmail = async (user) => {
    try {
        // Get featured products for the welcome email
        const featuredProducts = await Product.find({ status: 'Published' })
            .sort({ createdAt: -1 })
            .limit(4);
        
        const welcomeMessage = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to MegaBasket!</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333333; background-color: #f9f9f9;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #4CAF50, #2E8B57); padding: 30px 20px; text-align: center;">
                    <img src="${process.env.FRONTEND_URL}/logo.png" alt="MegaBasket Logo" style="max-height: 60px; margin-bottom: 10px;">
                    <h1 style="color: white; margin: 0; font-size: 24px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Welcome to MegaBasket!</h1>
                </div>
                
                <!-- Content -->
                <div style="max-width: 600px; margin: 0 auto; padding: 30px 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: -20px; position: relative;">
                    <p style="font-size: 16px; line-height: 1.6; color: #444;">Hi ${user.name},</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #444;">Welcome to MegaBasket! We're thrilled to have you join our community of savvy shoppers. Your account has been successfully created, and you're now ready to explore all that we have to offer.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">Shop Now</a>
                    </div>
                    
                    ${featuredProducts.length > 0 ? `
                        <div style="margin: 30px 0;">
                            <h3 style="color: #2E8B57; text-align: center; margin-bottom: 20px;">Featured Products You Might Like</h3>
                            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">
                                ${featuredProducts.map(product => `
                                    <div style="width: 45%; min-width: 120px; text-align: center; margin-bottom: 15px;">
                                        <img src="${product.images[0]}" alt="${product.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
                                        <p style="font-weight: bold; margin: 5px 0; font-size: 14px;">${product.name}</p>
                                        <p style="color: #4CAF50; margin: 5px 0; font-size: 14px;">₹${product.price.toFixed(2)}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div style="background-color: #f5f9f5; border-left: 4px solid #4CAF50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #2E8B57;">Your MegaBasket Benefits:</h4>
                        <ul style="padding-left: 20px; margin-bottom: 0;">
                            <li>Access to exclusive deals and promotions</li>
                            <li>Fast checkout with saved addresses</li>
                            <li>Order tracking and history</li>
                            <li>Personalized product recommendations</li>
                        </ul>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.6; color: #444; margin-bottom: 30px;">If you have any questions or need assistance, our customer service team is always ready to help!</p>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL}/contact" style="color: #4CAF50; text-decoration: none;">Contact Support</a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; color: #777777; font-size: 12px;">
                    <p style="margin-bottom: 10px;">© ${new Date().getFullYear()} MegaBasket. All rights reserved.</p>
                    <div style="margin-bottom: 15px;">
                        <a href="${process.env.FRONTEND_URL}/contact" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Contact Us</a> |
                        <a href="${process.env.FRONTEND_URL}/faq" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">FAQs</a> |
                        <a href="${process.env.FRONTEND_URL}/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms & Conditions</a> |
                        <a href="${process.env.FRONTEND_URL}/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <a href="https://facebook.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/facebook.png" alt="Facebook" style="width: 24px; height: 24px;"></a>
                        <a href="https://twitter.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/twitter.png" alt="Twitter" style="width: 24px; height: 24px;"></a>
                        <a href="https://instagram.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/instagram.png" alt="Instagram" style="width: 24px; height: 24px;"></a>
                    </div>
                    <p style="font-size: 11px; color: #999;">If you have any questions, please contact our customer service team at <a href="mailto:support@megabasket.com" style="color: #4CAF50;">support@megabasket.com</a></p>
                </div>
            </body>
            </html>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Welcome to MegaBasket!',
            message: welcomeMessage,
        });
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }
};

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

    // Send welcome email
    await sendWelcomeEmail(user);

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
        
        // Send welcome email for new Google OAuth users
        await sendWelcomeEmail(user);
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
    
    const message = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333333; background-color: #f9f9f9;">
            <!-- Header -->
            <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
                <img src="${process.env.FRONTEND_URL}/logo.png" alt="MegaBasket Logo" style="max-height: 60px; margin-bottom: 10px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
            </div>
            
            <!-- Content -->
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h2 style="color: #4CAF50; margin-top: 0; font-size: 20px;">Hello ${user.name},</h2>
                
                <p style="font-size: 16px; line-height: 1.5;">We received a request to reset your password for your MegaBasket account. If you didn't make this request, you can safely ignore this email.</p>
                
                <div style="background-color: #f5f5f5; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #333333;">To reset your password, click the button below. This link is valid for the next 15 minutes.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; font-size: 16px;">Reset My Password</a>
                </div>
                
                <p style="font-size: 14px; line-height: 1.5; color: #666666;">If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
                
                <p style="font-size: 14px; background-color: #f9f9f9; padding: 10px; border-radius: 4px; word-break: break-all;">
                    <a href="${resetUrl}" style="color: #4CAF50; text-decoration: none;">${resetUrl}</a>
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                    <p style="font-size: 14px; color: #666666; margin-bottom: 0;">For security reasons, this password reset link will expire in 15 minutes. If you need assistance, please contact our support team.</p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; color: #777777; font-size: 12px;">
                <p>© ${new Date().getFullYear()} MegaBasket. All rights reserved.</p>
                <p>
                    <a href="${process.env.FRONTEND_URL}/contact" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Contact Us</a> |
                    <a href="${process.env.FRONTEND_URL}/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms & Conditions</a> |
                    <a href="${process.env.FRONTEND_URL}/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                </p>
                <div style="margin-top: 15px;">
                    <a href="https://facebook.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/facebook.png" alt="Facebook" style="width: 24px; height: 24px;"></a>
                    <a href="https://twitter.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/twitter.png" alt="Twitter" style="width: 24px; height: 24px;"></a>
                    <a href="https://instagram.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/instagram.png" alt="Instagram" style="width: 24px; height: 24px;"></a>
                </div>
                <p style="margin-top: 15px; font-size: 11px;">If you have any questions, please don't hesitate to contact our customer service team at <a href="mailto:support@megabasket.com" style="color: #4CAF50;">support@megabasket.com</a></p>
            </div>
        </body>
        </html>
    `;

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
