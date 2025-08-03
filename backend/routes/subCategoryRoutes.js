const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getSubCategories,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
} = require('../controllers/subCategoryController');

router.route('/').get(getSubCategories).post(protect, admin, upload.single('image'), createSubCategory);
router.route('/:id').put(protect, admin, upload.single('image'), updateSubCategory).delete(protect, admin, deleteSubCategory);

module.exports = router;
