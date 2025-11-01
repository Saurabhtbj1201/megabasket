const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const SubCategory = require('../models/subCategoryModel');
const asyncHandler = require('express-async-handler');
const aws = require('aws-sdk');
const csv = require('csv-parser');
const fs = require('fs');

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

// @desc    Bulk import products from CSV
// @route   POST /api/products/bulk-import
// @access  Private/Admin
const bulkImportProducts = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('CSV file is required');
    }

    const csvFilePath = req.file.path;
    const products = [];
    const errors = [];
    let rowNumber = 1;

    try {
        // Get all categories and subcategories for validation
        const categories = await Category.find({});
        const subcategories = await SubCategory.find({});
        const categoryMap = {};
        const subcategoryMap = {};
        
        categories.forEach(cat => {
            categoryMap[cat.name.toLowerCase()] = cat._id;
        });
        
        subcategories.forEach(sub => {
            subcategoryMap[sub.name.toLowerCase()] = sub._id;
        });

        return new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    rowNumber++;
                    try {
                        // Validate required fields
                        if (!row.name || !row.price || !row.category) {
                            errors.push(`Row ${rowNumber}: Missing required fields (name, price, category)`);
                            return;
                        }

                        // Find category ID
                        const categoryId = categoryMap[row.category.toLowerCase()];
                        if (!categoryId) {
                            errors.push(`Row ${rowNumber}: Category "${row.category}" not found`);
                            return;
                        }

                        // Parse subcategories - only add warnings, don't block import
                        let subCategoryIds = [];
                        if (row.subcategory && row.subcategory.trim()) {
                            const subcategoryNames = row.subcategory.split(',').map(name => name.trim().toLowerCase());
                            subcategoryNames.forEach(name => {
                                if (name) {
                                    const subId = subcategoryMap[name];
                                    if (subId) {
                                        subCategoryIds.push(subId);
                                    } else {
                                        // Just add a warning, don't block the import
                                        console.warn(`Row ${rowNumber}: Subcategory "${name}" not found - skipping`);
                                    }
                                }
                            });
                        }

                        // Parse specifications
                        let specifications = [];
                        if (row.specifications && row.specifications.trim()) {
                            const specs = row.specifications.split('|');
                            specifications = specs.map(spec => {
                                const [key, value] = spec.split(':');
                                return { key: key?.trim(), value: value?.trim() };
                            }).filter(spec => spec.key && spec.value);
                        }

                        // Parse tags
                        const tags = row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

                        // Parse images
                        let images = ['https://via.placeholder.com/300']; // Default placeholder
                        if (row.photo && row.photo.trim()) {
                            images = [row.photo.trim()];
                            
                            // Add additional photos if provided
                            if (row['additional photo'] && row['additional photo'].trim()) {
                                const additionalPhotos = row['additional photo'].split(',')
                                    .map(url => url.trim())
                                    .filter(url => url);
                                images = [...images, ...additionalPhotos];
                            }
                        }

                        const product = {
                            name: row.name.trim(),
                            description: row.description || '',
                            price: parseFloat(row.price) || 0,
                            discount: parseFloat(row.discount) || 0,
                            category: categoryId,
                            subCategory: subCategoryIds,
                            stock: parseInt(row.stock) || 0,
                            brand: row.brand || '',
                            color: row.color || '',
                            tags,
                            shippingInfo: row.shippingInfo || 'Standard shipping',
                            status: row.status || 'Published',
                            specifications,
                            images,
                            rating: 0,
                            reviews: []
                        };

                        products.push(product);
                    } catch (error) {
                        errors.push(`Row ${rowNumber}: ${error.message}`);
                    }
                })
                .on('end', async () => {
                    try {
                        // Clean up uploaded file
                        if (fs.existsSync(csvFilePath)) {
                            fs.unlinkSync(csvFilePath);
                        }

                        if (errors.length > 0 && products.length === 0) {
                            return res.status(400).json({
                                message: 'Import failed with errors',
                                errors,
                                imported: 0
                            });
                        }

                        if (products.length === 0) {
                            return res.status(400).json({
                                message: 'No valid products found in CSV',
                                imported: 0
                            });
                        }

                        // Insert products in bulk
                        const insertedProducts = await Product.insertMany(products);
                        
                        const responseData = {
                            message: `Successfully imported ${insertedProducts.length} products`,
                            imported: insertedProducts.length,
                            products: insertedProducts
                        };

                        if (errors.length > 0) {
                            responseData.warnings = errors;
                            responseData.message += ` (${errors.length} warnings)`;
                        }
                        
                        res.status(201).json(responseData);
                        resolve();
                    } catch (error) {
                        console.error('Database insertion error:', error);
                        res.status(500).json({
                            message: 'Error saving products to database',
                            error: error.message
                        });
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    console.error('CSV parsing error:', error);
                    if (fs.existsSync(csvFilePath)) {
                        fs.unlinkSync(csvFilePath);
                    }
                    res.status(500).json({
                        message: 'Error processing CSV file',
                        error: error.message
                    });
                    reject(error);
                });
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        if (fs.existsSync(csvFilePath)) {
            fs.unlinkSync(csvFilePath);
        }
        res.status(500).json({
            message: 'Error processing bulk import',
            error: error.message
        });
    }
});

// @desc    Update product status
// @route   PATCH /api/products/:id/status
// @access  Private/Admin
const updateProductStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    if (!['Published', 'Draft', 'Hidden'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status value');
    }
    
    const product = await Product.findById(req.params.id);
    
    if (product) {
        product.status = status;
        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = { 
    searchProducts, 
    getAdminProducts, 
    getProducts, 
    getProductsByCategory, 
    getProductsByMultipleCategories, 
    getTopOffers, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getProductById,
    bulkImportProducts,
    updateProductStatus
};
