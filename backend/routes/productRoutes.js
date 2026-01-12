const express = require('express');
const router = express.Router();
const multer = require('multer');
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
    bulkImportProducts,
    updateProductStatus,
    bulkUpdateProducts,
    bulkDeleteProducts,
} = require('../controllers/productController');

// CSV upload configuration
const csvUpload = multer({ dest: 'uploads/' });

const imageUploadFields = [
    { name: 'defaultPhoto', maxCount: 1 },
    { name: 'additionalPhotos', maxCount: 5 }
];

router.route('/search').get(searchProducts);
router.route('/').get(getProducts).post(protect, admin, upload.fields(imageUploadFields), createProduct);
router.route('/admin').get(protect, admin, getAdminProducts);
router.route('/bulk-import').post(protect, admin, csvUpload.single('csvFile'), bulkImportProducts);
router.route('/top-offers').get(getTopOffers);
router.route('/bulk-update').patch(protect, admin, bulkUpdateProducts);
router.route('/bulk-delete').post(protect, admin, bulkDeleteProducts);
router.route('/categories').get(getProductsByMultipleCategories);
router.route('/category/:categoryId').get(getProductsByCategory);
router.patch('/:id/status', protect, admin, updateProductStatus);
router.route('/:id').get(getProductById).put(protect, admin, upload.fields(imageUploadFields), updateProduct).delete(protect, admin, deleteProduct);

module.exports = router;
