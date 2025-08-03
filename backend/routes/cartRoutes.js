const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCart, addToCart, updateCartItemQuantity, removeCartItem } = require('../controllers/cartController');

router.route('/')
    .get(protect, getCart)
    .post(protect, addToCart);

router.route('/:productId')
    .put(protect, updateCartItemQuantity)
    .delete(protect, removeCartItem);

module.exports = router;
