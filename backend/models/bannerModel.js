const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    image: { type: String, required: true }, // URL to image in S3
    title: { type: String, required: true },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
