const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('cart.product');

    if (user) {
        // Filter out any cart items where the referenced product has been deleted
        const validCartItems = user.cart.filter(item => item.product);

        // If the cart contained invalid items, update the user's cart in the DB
        if (validCartItems.length !== user.cart.length) {
            user.cart = validCartItems;
            await user.save();
        }

        // Further populate the category details for the valid items
        const populatedCart = await User.populate(validCartItems, {
            path: 'product.category',
            select: 'name'
        });

        res.json(populatedCart);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            // Product exists in cart, update quantity
            user.cart[itemIndex].quantity += quantity || 1;
        } else {
            // Product does not exist in cart, add new item
            user.cart.push({ product: productId, quantity: quantity || 1 });
        }
        const updatedUser = await user.save();
        await updatedUser.populate({
            path: 'cart.product',
            populate: { path: 'category', select: 'name' }
        });
        res.status(200).json(updatedUser.cart);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);
        if (itemIndex > -1) {
            user.cart[itemIndex].quantity = quantity;
            const updatedUser = await user.save();
            await updatedUser.populate({
                path: 'cart.product',
                populate: { path: 'category', select: 'name' }
            });
            res.json(updatedUser.cart);
        } else {
            res.status(404);
            throw new Error('Item not in cart');
        }
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeCartItem = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (user) {
        user.cart = user.cart.filter(item => item.product.toString() !== productId);
        const updatedUser = await user.save();
        await updatedUser.populate({
            path: 'cart.product',
            populate: { path: 'category', select: 'name' }
        });
        res.json(updatedUser.cart);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { getCart, addToCart, updateCartItemQuantity, removeCartItem };
