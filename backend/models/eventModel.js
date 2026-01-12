const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true // Allow null for anonymous users
    },
    sessionId: {
        type: String,
        index: true
    },
    eventType: {
        type: String,
        enum: ['view', 'add_to_cart', 'purchase', 'wishlist', 'rating', 'search', 'click', 'remove_from_cart'],
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        sparse: true
    },
    context: {
        page: String,
        referrerId: String,
        query: String,
        device: String,
        category: String,
        userAgent: String,
        ip: String
    },
    price: Number,
    quantity: Number,
    metadata: mongoose.Schema.Types.Mixed // For additional data
}, { 
    timestamps: true,
    // Add index for better query performance
    index: { userId: 1, eventType: 1, createdAt: -1 }
});

// Create compound indexes for common queries
eventSchema.index({ sessionId: 1, eventType: 1, createdAt: -1 });
eventSchema.index({ productId: 1, eventType: 1, createdAt: -1 });
eventSchema.index({ createdAt: -1 }); // For time-based queries

module.exports = mongoose.model('Event', eventSchema);
