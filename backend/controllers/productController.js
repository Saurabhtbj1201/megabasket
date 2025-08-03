const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const SubCategory = require('../models/subCategoryModel');
const asyncHandler = require('express-async-handler');

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
    const keyword = req.query.keyword;
    let query = { status: 'Published' };

    if (keyword) {
        // Find categories that match the keyword
        const matchingCategories = await Category.find({ name: { $regex: keyword, $options: 'i' } }).select('_id');
        const categoryIds = matchingCategories.map(cat => cat._id);

        // Find sub-categories that match the keyword
        const matchingSubCategories = await SubCategory.find({ name: { $regex: keyword, $options: 'i' } }).select('_id');
        const subCategoryIds = matchingSubCategories.map(sub => sub._id);

        query.$or = [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { brand: { $regex: keyword, $options: 'i' } },
            { tags: { $regex: keyword, $options: 'i' } },
            { category: { $in: categoryIds } },
            { subCategory: { $in: subCategoryIds } }
        ];
    }

    const products = await Product.find(query).populate('category', 'name');
    res.json(products);
});

// @desc    Get all products (for Admin)
// @route   GET /api/products/admin
// @access  Private/Admin
const getAdminProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).populate('category', 'name').sort({ createdAt: -1 });
    res.json(products);
});

// @desc    Get published products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ status: 'Published' });
    res.json(products);
});

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
const getProductsByCategory = asyncHandler(async (req, res) => {
    const products = await Product.find({ category: req.params.categoryId, status: 'Published' });
    res.json(products);
});

// @desc    Get products by multiple categories
// @route   GET /api/products/categories
// @access  Public
const getProductsByMultipleCategories = asyncHandler(async (req, res) => {
    const { ids } = req.query;
    if (!ids) {
        return res.json([]);
    }
    const categoryIds = ids.split(',');
    const products = await Product.find({ category: { $in: categoryIds }, status: 'Published' }).populate('category', 'name');
    res.json(products);
});

// @desc    Get top offered products
// @route   GET /api/products/top-offers
// @access  Public
const getTopOffers = asyncHandler(async (req, res) => {
    const products = await Product.find({ status: 'Published' }).sort({ discount: -1 }).limit(10);
    res.json(products);
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, discount, category, subCategory, stock, specifications, tags, shippingInfo, status, brand, color } = req.body;

    if (!req.files || !req.files.defaultPhoto) {
        res.status(400);
        throw new Error('Default product image is required.');
    }

    const images = [req.files.defaultPhoto[0].location];
    if (req.files.additionalPhotos) {
        req.files.additionalPhotos.forEach(file => images.push(file.location));
    }

    const product = await Product.create({
        name, description, price, discount, category, stock, images,
        subCategory: subCategory ? JSON.parse(subCategory) : [],
        specifications: JSON.parse(specifications || '[]'),
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        shippingInfo, status, brand, color
    });

    res.status(201).json(product);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const { name, description, price, discount, category, subCategory, stock, specifications, tags, shippingInfo, status, brand, color } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price !== undefined ? price : product.price;
        product.discount = discount !== undefined ? discount : product.discount;
        product.category = category || product.category;
        if (subCategory !== undefined) {
            product.subCategory = JSON.parse(subCategory);
        }
        product.stock = stock !== undefined ? stock : product.stock;
        product.specifications = specifications ? JSON.parse(specifications) : product.specifications;
        product.tags = tags ? tags.split(',').map(tag => tag.trim()) : product.tags;
        product.shippingInfo = shippingInfo || product.shippingInfo;
        product.status = status || product.status;

        if (brand !== undefined) {
            product.brand = brand;
        }
        if (color !== undefined) {
            product.color = color;
        }

        // Note: Image update logic is complex. This example replaces images if new ones are uploaded.
        if (req.files && req.files.defaultPhoto) {
            const newImages = [req.files.defaultPhoto[0].location];
            if (req.files.additionalPhotos) {
                req.files.additionalPhotos.forEach(file => newImages.push(file.location));
            }
            product.images = newImages;
        }

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
        await Product.deleteOne({ _id: req.params.id });
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// Placeholder
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = { searchProducts, getAdminProducts, getProducts, getProductsByCategory, getProductsByMultipleCategories, getTopOffers, createProduct, updateProduct, deleteProduct, getProductById };
