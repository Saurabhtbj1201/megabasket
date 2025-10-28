const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { addOrderItems, getOrders, updateOrderStatus, getMyOrders, getOrderById, getOrdersByUser, verifyPaymentAndUpdateOrder } = require('../controllers/orderController');

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/verify-payment').post(verifyPaymentAndUpdateOrder);
router.route('/myorders').get(protect, getMyOrders);
router.route('/user/:userId').get(protect, admin, getOrdersByUser);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/status').put(protect, admin, updateOrderStatus);

module.exports = router;
