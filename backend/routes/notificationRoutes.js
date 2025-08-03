const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markAllAsRead } = require('../controllers/notificationController');

router.route('/').get(protect, getNotifications);
router.route('/read').put(protect, markAllAsRead);

module.exports = router;
