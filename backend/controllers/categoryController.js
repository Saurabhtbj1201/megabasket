const Category = require('../models/categoryModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({});
    res.json(categories);
});

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
    const { name, imageUrl } = req.body;
    let imageLocation = '';

    if (req.file) {
        imageLocation = req.file.location;
    } else if (imageUrl) {
        imageLocation = imageUrl;
    } else {
        res.status(400);
        throw new Error('No image file or image URL provided.');
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
        res.status(400);
        throw new Error('Category already exists.');
    }

    const category = await Category.create({
        name,
        image: imageLocation,
    });

    res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
    const { name, imageUrl } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
        category.name = name || category.name;
        if (req.file) {
            category.image = req.file.location;
        } else if (imageUrl) {
            category.image = imageUrl;
        }
        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found.');
    }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (category) {
        await Category.deleteOne({ _id: req.params.id });
        res.json({ message: 'Category removed' });
    } else {
        res.status(404);
        throw new Error('Category not found.');
    }
});

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
