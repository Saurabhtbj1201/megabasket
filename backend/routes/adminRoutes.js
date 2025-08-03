const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getDashboardCounts, getDashboardStats } = require('../controllers/adminController');

router.route('/counts').get(protect, admin, getDashboardCounts);
router.route('/stats').get(protect, admin, getDashboardStats);

module.exports = router;
