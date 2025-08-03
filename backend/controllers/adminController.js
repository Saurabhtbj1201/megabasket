const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Banner = require('../models/bannerModel');
const SubCategory = require('../models/subCategoryModel');
const Contact = require('../models/contactModel');
const asyncHandler = require('express-async-handler');

// @desc    Get dashboard counts for sidebar
// @route   GET /api/admin/counts
// @access  Private/Admin
const getDashboardCounts = asyncHandler(async (req, res) => {
    const productCount = await Product.countDocuments({});
    const categoryCount = await Category.countDocuments({});
    const subCategoryCount = await SubCategory.countDocuments({});
    const orderCount = await Order.countDocuments({ status: { $ne: 'Delivered' } });
    const userCount = await User.countDocuments({ role: 'User' });
    const bannerCount = await Banner.countDocuments({});
    const contactCount = await Contact.countDocuments({ status: { $ne: 'Resolved' } });

    res.json({
        products: productCount,
        categories: categoryCount,
        subCategories: subCategoryCount,
        orders: orderCount,
        users: userCount,
        banners: bannerCount,
        contactMessages: contactCount
    });
});

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999); // Set to the end of the selected day
        dateFilter.createdAt = { $gte: new Date(startDate), $lte: endOfDay };
    }

    // KPIs
    const totalOrders = await Order.countDocuments(dateFilter);
    const totalCustomersResult = await Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$user' } },
        { $count: 'count' }
    ]);
    const totalCustomers = totalCustomersResult.length > 0 ? totalCustomersResult[0].count : 0;
    const totalProducts = await Product.countDocuments({});
    const totalRevenueResult = await Order.aggregate([
        { $match: { status: 'Delivered', ...dateFilter } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

    // Order Status Breakdown (Donut Chart)
    const orderStatusBreakdown = await Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Sales Performance (Area Chart)
    const salesPerformance = await Order.aggregate([
        { $match: { status: 'Delivered', ...dateFilter } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalRevenue: { $sum: "$totalPrice" },
            totalSales: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
    ]);

    // New Customers Trend (Line Chart)
    const newCustomers = await User.aggregate([
        { $match: { role: 'User', ...dateFilter } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
    ]);

    // Revenue by Category (Bar Chart)
    const revenueByCategory = await Order.aggregate([
        { $match: { status: 'Delivered', ...dateFilter } },
        { $unwind: '$orderItems' },
        {
            $lookup: {
                from: 'products',
                localField: 'orderItems.product',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        {
            $lookup: {
                from: 'categories',
                localField: 'productDetails.category',
                foreignField: '_id',
                as: 'categoryDetails'
            }
        },
        { $unwind: '$categoryDetails' },
        {
            $group: {
                _id: '$categoryDetails.name',
                totalRevenue: { $sum: { $multiply: [
                    { $ifNull: ['$orderItems.qty', 0] },
                    { $ifNull: ['$orderItems.price', 0] }
                ] } }
            }
        }
    ]);

    // Recent Orders
    const recentOrders = await Order.find(dateFilter).populate('user', 'name').sort({ createdAt: -1 }).limit(5);

    res.json({
        kpis: {
            totalOrders,
            totalCustomers,
            totalProducts,
            totalRevenue,
        },
        charts: {
            orderStatusBreakdown,
            revenueByCategory,
            salesPerformance,
            newCustomers,
        },
        recentOrders,
    });
});

module.exports = { getDashboardCounts, getDashboardStats };
