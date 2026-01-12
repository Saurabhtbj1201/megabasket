const Product = require('../models/productModel');
const Event = require('../models/eventModel');
const UserProfile = require('../models/userProfileModel');
const asyncHandler = require('express-async-handler');
const axios = require('axios');

// Configuration for Python ML service
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

// @desc    Get personalized recommendations
// @route   GET /api/recommendations/personalized
// @access  Public (supports both authenticated and anonymous users)
const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
    const { sessionId, limit = 10, context = 'homepage' } = req.query;
    const userId = req.user?._id;

    try {
        // Try to get ML-based recommendations
        const response = await axios.post(`${ML_SERVICE_URL}/recommendations/personalized`, {
            userId: userId?.toString(),
            sessionId,
            limit,
            context
        }, { timeout: 5000 });

        if (response.data.productIds && response.data.productIds.length > 0) {
            const products = await Product.find({
                _id: { $in: response.data.productIds },
                status: 'Published'
            }).populate('category', 'name');

            // Reorder products according to ML recommendation order
            const orderedProducts = response.data.productIds
                .map(id => products.find(p => p._id.toString() === id))
                .filter(Boolean);

            return res.json(orderedProducts);
        }
    } catch (mlError) {
        console.log('ML service unavailable, using fallback recommendations:', mlError.message);
    }

    // Fallback: Rule-based recommendations
    const recommendations = await getFallbackRecommendations(userId, sessionId, limit, context);
    res.json(recommendations);
});

// Fallback recommendation logic
const getFallbackRecommendations = async (userId, sessionId, limit, context) => {
    let recommendations = [];

    // Get user profile if available
    const profile = userId 
        ? await UserProfile.findOne({ userId }).populate('viewedProducts.productId')
        : await UserProfile.findOne({ sessionId }).populate('viewedProducts.productId');

    if (profile && profile.viewedProducts.length > 0) {
        // Get categories user has viewed
        const viewedCategories = profile.preferences.categories
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(c => c.categoryId);

        if (viewedCategories.length > 0) {
            recommendations = await Product.find({
                category: { $in: viewedCategories },
                _id: { $nin: profile.viewedProducts.map(v => v.productId) },
                status: 'Published'
            })
            .populate('category', 'name')
            .sort({ discount: -1, createdAt: -1 })
            .limit(limit);
        }
    }

    // If still not enough recommendations, add top offers
    if (recommendations.length < limit) {
        const remaining = limit - recommendations.length;
        const existingIds = recommendations.map(r => r._id);
        
        const topOffers = await Product.find({
            _id: { $nin: existingIds },
            status: 'Published'
        })
        .sort({ discount: -1 })
        .limit(remaining);

        recommendations = [...recommendations, ...topOffers];
    }

    return recommendations;
};

// @desc    Get "Customers Also Bought" recommendations
// @route   GET /api/recommendations/also-bought/:productId
// @access  Public
const getAlsoBought = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { limit = 6 } = req.query;

    try {
        const response = await axios.post(`${ML_SERVICE_URL}/recommendations/also-bought`, {
            productId,
            limit
        }, { timeout: 5000 });

        if (response.data.productIds) {
            const products = await Product.find({
                _id: { $in: response.data.productIds },
                status: 'Published'
            }).populate('category', 'name');

            return res.json(products);
        }
    } catch (mlError) {
        console.log('ML service unavailable for also-bought, using fallback');
    }

    // Fallback: Same category products
    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const recommendations = await Product.find({
        category: product.category,
        _id: { $ne: productId },
        status: 'Published'
    })
    .populate('category', 'name')
    .sort({ discount: -1 })
    .limit(limit);

    res.json(recommendations);
});

// @desc    Get "Customers Also Viewed" recommendations
// @route   GET /api/recommendations/also-viewed/:productId
// @access  Public
const getAlsoViewed = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { limit = 6 } = req.query;

    // Get users who viewed this product
    const viewEvents = await Event.find({
        productId,
        eventType: 'view'
    })
    .distinct('userId')
    .limit(100);

    if (viewEvents.length > 0) {
        // Get other products these users viewed
        const otherViews = await Event.aggregate([
            {
                $match: {
                    userId: { $in: viewEvents },
                    productId: { $ne: mongoose.Types.ObjectId(productId) },
                    eventType: 'view'
                }
            },
            {
                $group: {
                    _id: '$productId',
                    viewCount: { $sum: 1 }
                }
            },
            { $sort: { viewCount: -1 } },
            { $limit: parseInt(limit) }
        ]);

        const productIds = otherViews.map(v => v._id);
        const products = await Product.find({
            _id: { $in: productIds },
            status: 'Published'
        }).populate('category', 'name');

        return res.json(products);
    }

    // Fallback
    const product = await Product.findById(productId);
    const recommendations = await Product.find({
        category: product.category,
        _id: { $ne: productId },
        status: 'Published'
    })
    .populate('category', 'name')
    .limit(limit);

    res.json(recommendations);
});

// @desc    Get trending products
// @route   GET /api/recommendations/trending
// @access  Public
const getTrending = asyncHandler(async (req, res) => {
    const { limit = 10, days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get most viewed/purchased products in the last N days
    const trending = await Event.aggregate([
        {
            $match: {
                eventType: { $in: ['view', 'purchase', 'add_to_cart'] },
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$productId',
                score: {
                    $sum: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$eventType', 'purchase'] }, then: 10 },
                                { case: { $eq: ['$eventType', 'add_to_cart'] }, then: 3 },
                                { case: { $eq: ['$eventType', 'view'] }, then: 1 }
                            ],
                            default: 0
                        }
                    }
                }
            }
        },
        { $sort: { score: -1 } },
        { $limit: parseInt(limit) }
    ]);

    const productIds = trending.map(t => t._id);
    const products = await Product.find({
        _id: { $in: productIds },
        status: 'Published'
    }).populate('category', 'name');

    res.json(products);
});

// @desc    Update user profile based on events
// @route   POST /api/recommendations/update-profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get recent events for this user
    const recentEvents = await Event.find({ userId })
        .sort({ createdAt: -1 })
        .limit(1000)
        .populate('productId');

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
        profile = new UserProfile({ userId });
    }

    // Reset counters
    profile.preferences = { categories: [], brands: [], tags: [], priceRange: {} };
    profile.viewedProducts = [];
    profile.purchasedProducts = [];

    const categoryScores = {};
    const brandScores = {};
    const tagScores = {};
    const prices = [];

    for (const event of recentEvents) {
        if (!event.productId) continue;

        const product = event.productId;
        const weight = {
            view: 1,
            add_to_cart: 3,
            purchase: 10,
            wishlist: 5
        }[event.eventType] || 1;

        // Category preferences
        if (product.category) {
            categoryScores[product.category] = (categoryScores[product.category] || 0) + weight;
        }

        // Brand preferences
        if (product.brand) {
            brandScores[product.brand] = (brandScores[product.brand] || 0) + weight;
        }

        // Tag preferences
        if (product.tags && product.tags.length > 0) {
            product.tags.forEach(tag => {
                tagScores[tag] = (tagScores[tag] || 0) + weight;
            });
        }

        // Price tracking
        if (product.price) {
            prices.push(product.price);
        }

        // Viewed products
        if (event.eventType === 'view') {
            const existing = profile.viewedProducts.find(
                v => v.productId.toString() === product._id.toString()
            );
            if (existing) {
                existing.count++;
                existing.lastViewed = event.createdAt;
            } else {
                profile.viewedProducts.push({
                    productId: product._id,
                    count: 1,
                    lastViewed: event.createdAt
                });
            }
        }

        // Purchased products
        if (event.eventType === 'purchase') {
            const existing = profile.purchasedProducts.find(
                p => p.productId.toString() === product._id.toString()
            );
            if (existing) {
                existing.count++;
                existing.totalSpent += product.price * (event.quantity || 1);
                existing.lastPurchased = event.createdAt;
            } else {
                profile.purchasedProducts.push({
                    productId: product._id,
                    count: 1,
                    totalSpent: product.price * (event.quantity || 1),
                    lastPurchased: event.createdAt
                });
            }
        }
    }

    // Update preferences
    profile.preferences.categories = Object.entries(categoryScores).map(([categoryId, score]) => ({
        categoryId,
        score
    }));

    profile.preferences.brands = Object.entries(brandScores).map(([brand, score]) => ({
        brand,
        score
    }));

    profile.preferences.tags = Object.entries(tagScores).map(([tag, score]) => ({
        tag,
        score
    }));

    if (prices.length > 0) {
        profile.preferences.priceRange = {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: prices.reduce((a, b) => a + b, 0) / prices.length
        };
    }

    profile.lastUpdated = new Date();
    await profile.save();

    res.json({ message: 'Profile updated successfully', profile });
});

module.exports = {
    getPersonalizedRecommendations,
    getAlsoBought,
    getAlsoViewed,
    getTrending,
    updateUserProfile
};
