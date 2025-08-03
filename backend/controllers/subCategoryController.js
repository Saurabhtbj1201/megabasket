const SubCategory = require('../models/subCategoryModel');
const Product = require('../models/productModel');
const asyncHandler = require('express-async-handler');

// @desc    Create a sub-category
// @route   POST /api/subcategories
// @access  Private/Admin
const createSubCategory = asyncHandler(async (req, res) => {
    const { name, categories, imageUrl } = req.body;

    if (!name || !categories) {
        res.status(400);
        throw new Error('Name and at least one category are required');
    }

    const parsedCategories = JSON.parse(categories);
    if (!Array.isArray(parsedCategories) || parsedCategories.length === 0) {
        res.status(400);
        throw new Error('Categories must be a non-empty array of IDs');
    }

    const image = req.file ? req.file.location : imageUrl;
    if (!image) {
        res.status(400);
        throw new Error('Image is required');
    }

    const subCategoryExists = await SubCategory.findOne({ name });
    if (subCategoryExists) {
        res.status(400);
        throw new Error('Sub-category with this name already exists');
    }

    const subCategory = await SubCategory.create({
        name,
        categories: parsedCategories,
        image,
    });

    res.status(201).json(subCategory);
});

// @desc    Get all sub-categories
// @route   GET /api/subcategories
// @access  Public
const getSubCategories = asyncHandler(async (req, res) => {
    const subCategories = await SubCategory.find({}).populate('categories', 'name');
    res.json(subCategories);
});

// @desc    Update a sub-category
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
const updateSubCategory = asyncHandler(async (req, res) => {
    const { name, categories, imageUrl } = req.body;
    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
        res.status(404);
        throw new Error('Sub-category not found');
    }

    const parsedCategories = JSON.parse(categories);

    subCategory.name = name || subCategory.name;
    subCategory.categories = parsedCategories || subCategory.categories;
    if (req.file) {
        // In a real app, you'd delete the old image from S3 here
        subCategory.image = req.file.location;
    } else if (imageUrl) {
        subCategory.image = imageUrl;
    }

    const updatedSubCategory = await subCategory.save();
    const populatedSubCategory = await updatedSubCategory.populate('categories', 'name');
    res.json(populatedSubCategory);
});

// @desc    Delete a sub-category
// @route   DELETE /api/subcategories/:id
// @access  Private/Admin
const deleteSubCategory = asyncHandler(async (req, res) => {
    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
        res.status(404);
        throw new Error('Sub-category not found');
    }

    const productCount = await Product.countDocuments({ subCategory: req.params.id });
    if (productCount > 0) {
        res.status(400);
        throw new Error(`Cannot delete. ${productCount} products are linked to this sub-category.`);
    }

    // In a real app, you'd delete the image from S3 here
    await subCategory.remove();
    res.json({ message: 'Sub-category removed' });
});

module.exports = {
    createSubCategory,
    getSubCategories,
    updateSubCategory,
    deleteSubCategory,
};
