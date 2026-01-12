const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    sessionId: String, // For anonymous users
    preferences: {
        categories: [{
            categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
            score: { type: Number, default: 0 }
        }],
        brands: [{
            brand: String,
            score: { type: Number, default: 0 }
        }],
        priceRange: {
            min: Number,
            max: Number,
            avg: Number
        },
        tags: [{
            tag: String,
            score: { type: Number, default: 0 }
        }]
    },
    viewedProducts: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        count: { type: Number, default: 1 },
        lastViewed: { type: Date, default: Date.now }
    }],
    purchasedProducts: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        count: { type: Number, default: 1 },
        totalSpent: Number,
        lastPurchased: Date
    }],
    cartItems: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        addedAt: Date
    }],
    wishlistItems: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        addedAt: Date
    }],
    searchHistory: [{
        query: String,
        timestamp: Date,
        resultCount: Number
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster queries
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ sessionId: 1 });
userProfileSchema.index({ 'viewedProducts.productId': 1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);
