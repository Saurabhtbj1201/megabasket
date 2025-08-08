const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const SubCategory = require('../models/subCategoryModel');
const asyncHandler = require('express-async-handler');
const aws = require('aws-sdk');

// Configure AWS S3
const s3 = new aws.S3({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION,
});

// Helper function to delete images from S3
const deleteImagesFromS3 = async (imageUrls) => {
    if (!imageUrls || imageUrls.length === 0) return;
    
    // Extract keys from full URLs
    const keys = imageUrls.map(url => {
        // Parse the URL to get the key (filename path in S3)
        const urlParts = url.split('/');
        return urlParts.slice(3).join('/'); // Skip protocol and bucket name
    });
    
    const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Delete: {
            Objects: keys.map(key => ({ Key: key })),
            Quiet: false
        }
    };
    
    try {
        await s3.deleteObjects(deleteParams).promise();
        console.log(`Successfully deleted ${imageUrls.length} images from S3`);
    } catch (error) {
        console.error('Error deleting images from S3:', error);
    }
};

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
    const { name, description, price, discount, category, subCategory, stock, specifications, tags, shippingInfo, status, brand, color, removedImages } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
        // Handle removed images
        let imagesToDelete = [];
        if (removedImages) {
            try {
                imagesToDelete = JSON.parse(removedImages);
                // If imagesToDelete is not an array, convert it to one
                if (!Array.isArray(imagesToDelete)) {
                    imagesToDelete = [imagesToDelete];
                }
                
                // Filter out the removed images from the product's images array
                product.images = product.images.filter(img => !imagesToDelete.includes(img));
                
                // Delete images from S3
                await deleteImagesFromS3(imagesToDelete);
            } catch (error) {
                console.error('Error parsing removedImages:', error);
            }
        }

        // Update product fields
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

        // Handle new images
        if (req.files) {
            const newImages = [];
            
            // Add default photo if provided
            if (req.files.defaultPhoto) {
                newImages.push(req.files.defaultPhoto[0].location);
            }
            
            // Add additional photos if provided
            if (req.files.additionalPhotos) {
                req.files.additionalPhotos.forEach(file => newImages.push(file.location));
            }
            
            if (newImages.length > 0) {
                // If a new default photo was uploaded, replace the first image
                if (req.files.defaultPhoto) {
                    // The default image was already removed if it was in removedImages
                    if (product.images.length === 0) {
                        product.images = [...newImages];
                    } else {
                        product.images = [newImages[0], ...product.images.slice(1)];
                        // Remove the default photo from newImages to avoid adding it twice
                        newImages.shift();
                    }
                }
                
                // Add remaining new images
                product.images = [...product.images, ...newImages.filter(img => !product.images.includes(img))];
            }
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
        // Delete all product images from S3
        if (product.images && product.images.length > 0) {
            await deleteImagesFromS3(product.images);
        }
        
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
