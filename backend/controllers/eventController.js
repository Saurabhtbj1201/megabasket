const Event = require('../models/eventModel');
const asyncHandler = require('express-async-handler');

// @desc    Track user event
// @route   POST /api/events
// @access  Public (supports both authenticated and anonymous users)
const trackEvent = asyncHandler(async (req, res) => {
    const { eventType, productId, context, price, quantity, sessionId, metadata } = req.body;

    // Validate required fields
    if (!eventType || !sessionId) {
        res.status(400);
        throw new Error('eventType and sessionId are required');
    }

    const eventData = {
        eventType,
        sessionId,
        productId,
        context: {
            ...context,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress
        },
        price,
        quantity,
        metadata
    };

    // Add userId if user is authenticated
    if (req.user) {
        eventData.userId = req.user._id;
    }

    const event = await Event.create(eventData);
    res.status(201).json({ success: true, eventId: event._id });
});

// @desc    Get user events
// @route   GET /api/events/user/:userId
// @access  Private/Admin
const getUserEvents = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { eventType, limit = 100, page = 1 } = req.query;

    const query = { userId };
    if (eventType) {
        query.eventType = eventType;
    }

    const events = await Event.find(query)
        .populate('productId', 'name images price category')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
        events,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEvents: total
    });
});

// @desc    Get session events (for anonymous users)
// @route   GET /api/events/session/:sessionId
// @access  Public
const getSessionEvents = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { eventType, limit = 50 } = req.query;

    const query = { sessionId };
    if (eventType) {
        query.eventType = eventType;
    }

    const events = await Event.find(query)
        .populate('productId', 'name images price category')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    res.json(events);
});

// @desc    Get product event analytics
// @route   GET /api/events/product/:productId/analytics
// @access  Private/Admin
const getProductAnalytics = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await Event.aggregate([
        {
            $match: {
                productId: mongoose.Types.ObjectId(productId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$eventType',
                count: { $sum: 1 }
            }
        }
    ]);

    res.json(analytics);
});

module.exports = {
    trackEvent,
    getUserEvents,
    getSessionEvents,
    getProductAnalytics
};
