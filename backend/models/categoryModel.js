const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true }, // URL to image in S3
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
