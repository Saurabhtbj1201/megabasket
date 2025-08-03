const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const asyncHandler = require('express-async-handler');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            status: 'Order Received',
        });

        if (paymentMethod === 'COD') {
            order.isPaid = false;
        }
        // For other payment methods like UPI/Card, you would handle payment gateway webhooks
        // to update isPaid to true upon successful payment.

        const createdOrder = await order.save();

        const user = await User.findById(req.user._id);
        user.cart = [];
        await user.save();

        res.status(201).json(createdOrder);
    }
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: 1 });
    res.json(orders);
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
        order.status = req.body.status || order.status;
        if (req.body.status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        } else {
            order.isDelivered = false;
            order.deliveredAt = null;
        }
        const updatedOrder = await order.save();

        // Create a notification for the user
        await Notification.create({
            user: order.user,
            message: `Your order #${order._id.toString().substring(0, 8)} has been updated to: ${order.status}`,
            link: '/profile?tab=orders'
        });

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order && (order.user._id.toString() === req.user._id.toString() || req.user.role === 'Admin')) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get orders by user ID (Admin)
// @route   GET /api/orders/user/:userId
// @access  Private/Admin
const getOrdersByUser = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
});

module.exports = {
    addOrderItems,
    getOrders,
    updateOrderStatus,
    getMyOrders,
    getOrderById,
    getOrdersByUser,
};
