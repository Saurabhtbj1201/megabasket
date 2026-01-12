const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    trackEvent,
    getUserEvents,
    getSessionEvents,
    getProductAnalytics
} = require('../controllers/eventController');

// Optional auth middleware - allows both authenticated and anonymous
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        // If token exists, try to authenticate
        return protect(req, res, next);
    }
    // If no token, continue without authentication
    next();
};

router.post('/', optionalAuth, trackEvent);
router.get('/user/:userId', protect, admin, getUserEvents);
router.get('/session/:sessionId', getSessionEvents);
router.get('/product/:productId/analytics', protect, admin, getProductAnalytics);

module.exports = router;
