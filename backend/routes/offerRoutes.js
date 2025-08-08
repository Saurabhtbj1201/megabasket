const express = require('express');
const router = express.Router();
const { createOrUpdateOffer, getOffers, deleteOffer } = require('../controllers/offerController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to get all offers
router.route('/').get(getOffers);

// Admin routes with protection
router.route('/')
  .post(protect, admin, createOrUpdateOffer);

router.route('/:id')
  .delete(protect, admin, deleteOffer);

module.exports = router;
