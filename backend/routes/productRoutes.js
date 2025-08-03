const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
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
} = require('../controllers/productController');

const imageUploadFields = [
    { name: 'defaultPhoto', maxCount: 1 },
    { name: 'additionalPhotos', maxCount: 5 }
];

router.route('/search').get(searchProducts);
router.route('/').get(getProducts).post(protect, admin, upload.fields(imageUploadFields), createProduct);
router.route('/admin').get(protect, admin, getAdminProducts);
router.route('/top-offers').get(getTopOffers);
router.route('/categories').get(getProductsByMultipleCategories);
router.route('/category/:categoryId').get(getProductsByCategory);
router.route('/:id').get(getProductById).put(protect, admin, upload.fields(imageUploadFields), updateProduct).delete(protect, admin, deleteProduct);

module.exports = router;
