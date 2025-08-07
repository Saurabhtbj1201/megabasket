const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const asyncHandler = require('express-async-handler');
const sendEmail = require('../utils/sendEmail');

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

        // Send order confirmation email
        try {
            const estimatedDeliveryDate = () => {
                const deliveryDays = createdOrder.orderItems.length <= 5 ? 4 : 7;
                const date = new Date(createdOrder.createdAt);
                date.setDate(date.getDate() + deliveryDays);
                return date.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });
            };

            const formatCurrency = (amount) =>
                new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                }).format(amount);

            const emailMessage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Order Confirmation</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333333; background-color: #f9f9f9;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #4CAF50, #2E8B57); padding: 30px 20px; text-align: center;">
                        <img src="${process.env.FRONTEND_URL}/logo.png" alt="MegaBasket Logo" style="max-height: 60px; margin-bottom: 10px;">
                        <h1 style="color: white; margin: 0; font-size: 24px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Order Confirmation</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="max-width: 600px; margin: 0 auto; padding: 30px 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: -20px; position: relative;">
                        <p style="font-size: 16px; line-height: 1.6; color: #444;">Hi ${user.name},</p>
                        <p style="font-size: 16px; line-height: 1.6; color: #444;">Thank you for your order! We're excited to get your products to you as soon as possible.</p>
                        
                        <div style="background-color: #f5f9f5; border-left: 4px solid #4CAF50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                            <h2 style="color: #2E8B57; margin-top: 0; font-size: 18px;">Order Summary</h2>
                            <p style="margin: 8px 0;"><strong>Order #:</strong> ${createdOrder._id.toString().substring(0, 8)}</p>
                            <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(createdOrder.createdAt).toLocaleString()}</p>
                            <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${createdOrder.paymentMethod}</p>
                            <p style="margin: 8px 0;"><strong>Estimated Delivery:</strong> ${estimatedDeliveryDate()}</p>
                        </div>
                        
                        <h3 style="color: #2E8B57; border-bottom: 2px solid #e8f5e9; padding-bottom: 10px; font-size: 18px; margin-top: 30px;">Items Ordered</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                            <thead>
                                <tr style="background-color: #e8f5e9;">
                                    <th style="text-align: left; padding: 12px; border-bottom: 1px solid #ddd;">Product</th>
                                    <th style="text-align: center; padding: 12px; border-bottom: 1px solid #ddd;">Qty</th>
                                    <th style="text-align: right; padding: 12px; border-bottom: 1px solid #ddd;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${createdOrder.orderItems.map(item => `
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #eee;">
                                            <div style="display: flex; align-items: center;">
                                                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                                                <span style="font-weight: 500;">${item.name}</span>
                                            </div>
                                        </td>
                                        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${item.qty}</td>
                                        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">${formatCurrency(item.price * item.qty)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="text-align: right; padding: 12px; font-weight: bold;">Subtotal:</td>
                                    <td style="text-align: right; padding: 12px;">${formatCurrency(createdOrder.itemsPrice)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="text-align: right; padding: 12px; font-weight: bold;">Shipping:</td>
                                    <td style="text-align: right; padding: 12px;">${formatCurrency(createdOrder.shippingPrice)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="text-align: right; padding: 12px; font-weight: bold;">Tax:</td>
                                    <td style="text-align: right; padding: 12px;">${formatCurrency(createdOrder.taxPrice)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="text-align: right; padding: 12px; font-weight: bold; font-size: 16px;">Total:</td>
                                    <td style="text-align: right; padding: 12px; font-weight: bold; font-size: 16px; color: #2E8B57;">${formatCurrency(createdOrder.totalPrice)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <h3 style="color: #2E8B57; border-bottom: 2px solid #e8f5e9; padding-bottom: 10px; font-size: 18px;">Shipping Address</h3>
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
                            <p style="margin: 5px 0;"><strong>${createdOrder.shippingAddress.name}</strong></p>
                            <p style="margin: 5px 0;">${createdOrder.shippingAddress.street}</p>
                            <p style="margin: 5px 0;">${createdOrder.shippingAddress.city}, ${createdOrder.shippingAddress.state} - ${createdOrder.shippingAddress.zip}</p>
                            <p style="margin: 5px 0;">${createdOrder.shippingAddress.country}</p>
                            ${createdOrder.shippingAddress.phone ? `<p style="margin: 5px 0;">Phone: ${createdOrder.shippingAddress.phone}</p>` : ''}
                        </div>
                        
                        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 4px; margin: 25px 0;">
                            <p style="margin: 0; color: #2E8B57; font-weight: 500;">You can track your order status by visiting your <a href="${process.env.FRONTEND_URL}/profile?tab=orders" style="color: #2E8B57; text-decoration: underline;">order history</a>.</p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL}/order/${createdOrder._id}" style="display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; font-size: 16px;">View Order Details</a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; color: #777777; font-size: 12px;">
                        <p style="margin-bottom: 10px;">© ${new Date().getFullYear()} MegaBasket. All rights reserved.</p>
                        <div style="margin-bottom: 15px;">
                            <a href="${process.env.FRONTEND_URL}/contact" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Contact Us</a> |
                            <a href="${process.env.FRONTEND_URL}/faq" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">FAQs</a> |
                            <a href="${process.env.FRONTEND_URL}/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms & Conditions</a> |
                            <a href="${process.env.FRONTEND_URL}/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <a href="https://facebook.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/facebook.png" alt="Facebook" style="width: 24px; height: 24px;"></a>
                            <a href="https://twitter.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/twitter.png" alt="Twitter" style="width: 24px; height: 24px;"></a>
                            <a href="https://instagram.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/instagram.png" alt="Instagram" style="width: 24px; height: 24px;"></a>
                        </div>
                        <p style="font-size: 11px; color: #999;">If you have any questions, please contact our customer service team at <a href="mailto:support@megabasket.com" style="color: #4CAF50;">support@megabasket.com</a></p>
                    </div>
                </body>
                </html>
            `;

            await sendEmail({
                email: user.email,
                subject: `Your MegaBasket Order Confirmation #${createdOrder._id.toString().substring(0, 8)}`,
                message: emailMessage,
            });
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
        }


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
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
        const oldStatus = order.status;
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

        // Send status update email if status has changed
        if (oldStatus !== updatedOrder.status) {
            try {
                let statusColor;
                let statusIcon;
                let statusMessage;

                switch (updatedOrder.status) {
                    case 'Processing':
                        statusColor = "#FF9800"; // Orange
                        statusIcon = "📦";
                        statusMessage = "We're processing your order and getting your items ready for shipment.";
                        break;
                    case 'Order Dispatched':
                        statusColor = "#2196F3"; // Blue
                        statusIcon = "🚚";
                        statusMessage = "Great news! Your order has been dispatched from our warehouse and is on its way to you.";
                        break;
                    case 'Shipped':
                        statusColor = "#03A9F4"; // Light Blue
                        statusIcon = "🚢";
                        statusMessage = "Your order has been shipped with our delivery partner. You can track it soon!";
                        break;
                    case 'In Transit':
                        statusColor = "#9C27B0"; // Purple
                        statusIcon = "🔄";
                        statusMessage = "Your order is in transit and will be out for delivery soon. Not long to wait now!";
                        break;
                    case 'Delivered':
                        statusColor = "#4CAF50"; // Green
                        statusIcon = "✅";
                        statusMessage = "Your order has been delivered! We hope you enjoy your purchase. Thank you for shopping with us.";
                        break;
                    case 'Cancelled':
                        statusColor = "#F44336"; // Red
                        statusIcon = "❌";
                        statusMessage = "Your order has been cancelled. If you have any questions, please contact our support team.";
                        break;
                    default:
                        statusColor = "#607D8B"; // Blue Grey
                        statusIcon = "📋";
                        statusMessage = `Your order status has been updated to: ${updatedOrder.status}`;
                }

                const emailMessage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Order Status Update</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333333; background-color: #f9f9f9;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}DD); padding: 30px 20px; text-align: center;">
                        <img src="${process.env.FRONTEND_URL}/logo.png" alt="MegaBasket Logo" style="max-height: 60px; margin-bottom: 10px;">
                        <h1 style="color: white; margin: 0; font-size: 24px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Order Status Update</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="max-width: 600px; margin: 0 auto; padding: 30px 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: -20px; position: relative;">
                        <p style="font-size: 16px; line-height: 1.6; color: #444;">Hi ${order.user.name},</p>
                        
                        <div style="background-color: #f5f5f5; border-left: 4px solid ${statusColor}; padding: 20px; margin: 25px 0; border-radius: 4px;">
                            <div style="font-size: 48px; text-align: center; margin-bottom: 15px;">${statusIcon}</div>
                            <h2 style="color: ${statusColor}; margin: 0 0 10px 0; font-size: 20px; text-align: center;">Your Order is Now: ${updatedOrder.status}</h2>
                            <p style="margin: 5px 0; font-size: 16px; line-height: 1.6; text-align: center;">${statusMessage}</p>
                        </div>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 25px 0;">
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().substring(0, 8)}</p>
                            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                        </div>
                       <div style="margin: 2rem 0 5rem 0; position: relative;">
                        <!-- Progress Line -->
                        <div style="position: relative; height: 4px; background-color: #E0E0E0;">
                            <div style="
                                height: 100%; 
                                width: ${order.status === 'Order Received' ? '16.6%' :
                        order.status === 'Processing' ? '33.2%' :
                            order.status === 'Order Dispatched' ? '49.8%' :
                                order.status === 'Shipped' ? '66.4%' :
                                    order.status === 'In Transit' ? '83%' :
                                        order.status === 'Delivered' ? '100%' : '0%'
                    }; 
                                background-color: ${statusColor};
                                position: absolute; 
                                top: 0; 
                                left: 0;
                            "></div>
                        </div>

                        <!-- Status Dots + Labels -->
                        <div style="
                            display: flex; 
                            justify-content: space-between; 
                            gap: 3rem; 
                            flex-wrap: wrap;
                            margin-top: -10px; 
                            position: relative;
                        ">
                            ${[
                        "Order Received",
                        "Processing",
                        "Order Dispatched",
                        "Shipped",
                        "In Transit",
                        "Delivered"
                    ].map((stage, index) => `
                                <div style="flex: 1; min-width: 90px; text-align: center;">
                                    <div style="
                                        width: 20px;
                                        height: 20px;
                                        margin: 0 auto;
                                        border-radius: 50%;
                                        background-color: ${stage === order.status ||
                            ([
                                "Order Received",
                                "Processing",
                                "Order Dispatched",
                                "Shipped",
                                "In Transit",
                                "Delivered"
                            ].indexOf(stage) <= [
                                "Order Received",
                                "Processing",
                                "Order Dispatched",
                                "Shipped",
                                "In Transit",
                                "Delivered"
                            ].indexOf(order.status))
                            ? statusColor : '#E0E0E0'};
                                        border: 2px solid white;
                                        position: relative;
                                        top: -12px;
                                    "></div>
                                    <p style="margin-top: 8px; font-size: 12px; white-space: normal;">${stage}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                        
                        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 40px;">Order Summary</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr style="background-color: #f9f9f9;">
                                <th style="text-align: left; padding: 10px; border-bottom: 1px solid #eee;">Product</th>
                                <th style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">Qty</th>
                            </tr>
                            ${order.orderItems.map(item => `
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                        <div style="display: flex; align-items: center;">
                                            <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 4px;">
                                            <span>${item.name}</span>
                                        </div>
                                    </td>
                                    <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">${item.qty}</td>
                                </tr>
                            `).join('')}
                        </table>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL}/order/${order._id}" style="display: inline-block; background-color: ${statusColor}; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; font-size: 16px;">View Order Details</a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; color: #777777; font-size: 12px;">
                        <p style="margin-bottom: 10px;">© ${new Date().getFullYear()} MegaBasket. All rights reserved.</p>
                        <div style="margin-bottom: 15px;">
                            <a href="${process.env.FRONTEND_URL}/contact" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Contact Us</a> |
                            <a href="${process.env.FRONTEND_URL}/faq" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">FAQs</a> |
                            <a href="${process.env.FRONTEND_URL}/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms & Conditions</a> |
                            <a href="${process.env.FRONTEND_URL}/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <a href="https://facebook.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/facebook.png" alt="Facebook" style="width: 24px; height: 24px;"></a>
                            <a href="https://twitter.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/twitter.png" alt="Twitter" style="width: 24px; height: 24px;"></a>
                            <a href="https://instagram.com/megabasket" style="display: inline-block; margin: 0 5px;"><img src="${process.env.FRONTEND_URL}/email-png/instagram.png" alt="Instagram" style="width: 24px; height: 24px;"></a>
                        </div>
                        <p style="font-size: 11px; color: #999;">If you have any questions, please contact our customer service team at <a href="mailto:support@megabasket.com" style="color: #4CAF50;">support@megabasket.com</a></p>
                    </div>
                </body>
                </html>
                `;

                await sendEmail({
                    email: order.user.email,
                    subject: `Update on Your MegaBasket Order #${order._id.toString().substring(0, 8)}: ${updatedOrder.status}`,
                    message: emailMessage,
                });
            } catch (emailError) {
                console.error(`Failed to send status update email for order ${order._id}:`, emailError);
            }
        }

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
