const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true }, // URL to image in S3
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
}, { timestamps: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);
