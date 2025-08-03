const Banner = require('../models/bannerModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
const getBanners = asyncHandler(async (req, res) => {
    const banners = await Banner.find({}).populate('category', 'name').populate('product', 'name');
    res.json(banners);
});

// @desc    Create a new banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
    const { title, description, category, product } = req.body;
    if (!req.file) {
        res.status(400);
        throw new Error('No image file uploaded.');
    }

    const banner = await Banner.create({
        title,
        description,
        category: category || null,
        product: product || null,
        image: req.file.location,
    });

    res.status(201).json(banner);
});

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res) => {
    const { title, description, category, product } = req.body;
    const banner = await Banner.findById(req.params.id);

    if (banner) {
        banner.title = title || banner.title;
        banner.description = description || banner.description;
        banner.category = category || banner.category;
        banner.product = product || banner.product;
        if (req.file) {
            banner.image = req.file.location;
        }
        const updatedBanner = await banner.save();
        res.json(updatedBanner);
    } else {
        res.status(404);
        throw new Error('Banner not found.');
    }
});

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);
    if (banner) {
        await Banner.deleteOne({ _id: req.params.id });
        res.json({ message: 'Banner removed' });
    } else {
        res.status(404);
        throw new Error('Banner not found.');
    }
});

module.exports = {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
};
