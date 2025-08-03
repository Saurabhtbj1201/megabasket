const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true },
    comment: { type: String },
}, { timestamps: true });

const specificationSchema = new mongoose.Schema({
    key: { type: String, required: true },
    value: { type: String, required: true },
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }],
    brand: { type: String },
    color: { type: String },
    stock: { type: Number, required: true, default: 0 },
    images: [{ type: String, required: true }], // URLs to images in S3
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    specifications: [specificationSchema],
    tags: [String],
    shippingInfo: { type: String },
    status: { type: String, enum: ['Published', 'Draft', 'Hidden'], default: 'Published' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
