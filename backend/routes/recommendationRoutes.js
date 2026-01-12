const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getPersonalizedRecommendations,
    getAlsoBought,
    getAlsoViewed,
    getTrending,
    updateUserProfile
} = require('../controllers/recommendationController');

// Optional auth middleware
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        return protect(req, res, next);
    }
    next();
};

router.get('/personalized', optionalAuth, getPersonalizedRecommendations);
router.get('/also-bought/:productId', getAlsoBought);
router.get('/also-viewed/:productId', getAlsoViewed);
router.get('/trending', getTrending);
router.post('/update-profile', protect, updateUserProfile);

module.exports = router;
