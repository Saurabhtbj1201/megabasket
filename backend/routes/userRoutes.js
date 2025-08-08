const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getUserProfile,
    updateUserProfile,
    changePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    getUsers,
    getUserById,
    getAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    getUserLoginActivity,
    removeLoginSession 
} = require('../controllers/userController');

// Placeholder for admin functions
const userController = {
    deleteUser: (req, res) => res.send(`Delete user ${req.params.id} (Admin)`),
};

router.route('/profile').get(protect, getUserProfile).put(protect, upload.single('profilePicture'), updateUserProfile);
router.route('/profile/password').put(protect, changePassword);

router.route('/profile/address').post(protect, addAddress);
router.route('/profile/address/:id').put(protect, updateAddress).delete(protect, deleteAddress);

router.route('/admins').get(protect, admin, getAdmins).post(protect, admin, upload.single('profilePicture'), createAdmin);
router.route('/admins/:id').put(protect, admin, upload.single('profilePicture'), updateAdmin).delete(protect, admin, deleteAdmin);

router.route('/').get(protect, admin, getUsers);
router.route('/:id').get(protect, admin, getUserById).delete(protect, admin, userController.deleteUser);

// User login activity routes
router.route('/profile/login-activity')
  .get(protect, getUserLoginActivity);

router.route('/profile/login-activity/:id')
  .delete(protect, removeLoginSession);

module.exports = router;
