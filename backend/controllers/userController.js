const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            addresses: user.addresses,
            profilePicture: user.profilePicture,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;

        if (req.file) {
            user.profilePicture = req.file.location;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            profilePicture: updatedUser.profilePicture,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Change user password
// @route   PUT /api/users/profile/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(oldPassword))) {
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } else {
        res.status(401);
        throw new Error('Invalid old password');
    }
});

// @desc    Add a new address
// @route   POST /api/users/profile/address
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.addresses.push(req.body);
        const updatedUser = await user.save();
        res.status(201).json(updatedUser.addresses);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update an address
// @route   PUT /api/users/profile/address/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        const address = user.addresses.id(req.params.id);
        if (address) {
            address.street = req.body.street || address.street;
            address.city = req.body.city || address.city;
            address.state = req.body.state || address.state;
            address.zip = req.body.zip || address.zip;
            address.country = req.body.country || address.country;
            await user.save();
            res.json(user.addresses);
        } else {
            res.status(404);
            throw new Error('Address not found');
        }
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete an address
// @route   DELETE /api/users/profile/address/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.addresses.id(req.params.id).remove();
        await user.save();
        res.json({ message: 'Address removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all users (non-admins)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: 'User' }).select('-password');
    res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all admins
// @route   GET /api/users/admins
// @access  Private/Admin
const getAdmins = asyncHandler(async (req, res) => {
    const admins = await User.find({ role: 'Admin' }).select('-password');
    res.json(admins);
});

// @desc    Create a new admin
// @route   POST /api/users/admins
// @access  Private/Admin
const createAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = new User({
        name,
        email,
        password,
        role: 'Admin',
        isVerified: true, // Admins are verified by default
    });

    if (req.file) {
        user.profilePicture = req.file.location;
    }

    const createdUser = await user.save();
    res.status(201).json({
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        profilePicture: createdUser.profilePicture,
    });
});

// @desc    Update an admin
// @route   PUT /api/users/admins/:id
// @access  Private/Admin
const updateAdmin = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user && user.role === 'Admin') {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;

        if (req.file) {
            user.profilePicture = req.file.location;
        }

        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404);
        throw new Error('Admin not found');
    }
});

// @desc    Delete an admin
// @route   DELETE /api/users/admins/:id
// @access  Private/Admin
const deleteAdmin = asyncHandler(async (req, res) => {
    if (req.user._id.toString() === req.params.id) {
        res.status(400);
        throw new Error("You cannot delete your own admin account.");
    }

    const user = await User.findById(req.params.id);

    if (user && user.role === 'Admin') {
        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'Admin removed' });
    } else {
        res.status(404);
        throw new Error('Admin not found');
    }
});

module.exports = {
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
};
