const express = require('express');
const router = express.Router();
const {
    registerUser,
    verifyOtp,
    loginUser,
    loginAdmin,
    googleAuth,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/admin/login', loginAdmin);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
