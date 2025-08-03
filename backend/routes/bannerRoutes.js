const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
} = require('../controllers/bannerController');

router.route('/').get(getBanners).post(protect, admin, upload.single('image'), createBanner);
router.route('/:id').put(protect, admin, upload.single('image'), updateBanner).delete(protect, admin, deleteBanner);

module.exports = router;
