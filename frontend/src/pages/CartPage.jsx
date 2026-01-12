import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FiTrash2 } from 'react-icons/fi';
import ProductCarousel from '../components/ProductCarousel';
import { formatCurrency } from '../utils/formatCurrency';
import Meta from '../components/Meta';
import './CartPage.css';
import './AllCategoriesPage.css'; // For shared status styles
import { trackRemoveFromCart } from '../utils/eventTracker';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [cartRecommendations, setCartRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { userInfo, setCartCount } = useAuth();
    const navigate = useNavigate();

    const fetchCart = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('/api/cart', config);
            setCartItems(data);
            const count = data.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
        } catch (error) {
            toast.error('Could not fetch cart items.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo) {
            fetchCart();
        }
        
        // Fetch cart-specific recommendations
        const fetchCartRecommendations = async () => {
            try {
                const sessionId = sessionStorage.getItem('sessionId');
                const token = userInfo?.token;
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                
                const { data } = await axios.get(
                    `/api/recommendations/personalized?sessionId=${sessionId}&limit=8&context=cart`,
                    config
                );
                setCartRecommendations(data);
            } catch (error) {
                console.error("Failed to fetch cart recommendations");
            }
        };
        fetchCartRecommendations();
    }, [userInfo]);

    const handleQuantityChange = async (productId, quantity) => {
        if (quantity < 1) return;
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.put(`/api/cart/${productId}`, { quantity }, config);
            setCartItems(data);
            const count = data.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
        } catch (error) {
            toast.error('Failed to update quantity.');
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.delete(`/api/cart/${productId}`, config);
            setCartItems(data);
            const count = data.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
            
            // Track removal
            await trackRemoveFromCart(productId);
            
            toast.success('Item removed from cart.');
        } catch (error) {
            toast.error('Failed to remove item.');
        }
    };

    const { subtotal, deliveryCharge, packagingCharge, gst, grandTotal, totalQuantity } = useMemo(() => {
        const sub = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
        const delivery = 35 * cartItems.length;
        const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        const packaging = 10 * totalQty;
        const gstAmount = sub * 0.03;
        const total = sub + delivery + packaging + gstAmount;
        return { subtotal: sub, deliveryCharge: delivery, packagingCharge: packaging, gst: gstAmount, grandTotal: total, totalQuantity: totalQty };
    }, [cartItems]);

    if (!userInfo) {
        return (
            <>
                <Meta title="Shopping Cart | MegaBasket" />
                <div className="container empty-cart"><h2>Please log in to view your cart.</h2></div>
            </>
        );
    }

    if (loading) {
        return (
            <div className="preloader">
                <p>Loading Cart...</p>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <>
                <Meta title="Shopping Cart | MegaBasket" />
                <div className="container empty-cart">
                    <h2>Your Cart is Empty</h2>
                    <p>Looks like you haven't added anything to your cart yet.</p>
                    <Link to="/" className="auth-button">Continue Shopping</Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Meta title="Shopping Cart | MegaBasket" description="Review items in your shopping cart and proceed to checkout." />
            <div className="container">
                <h1 className="cart-page-title">Shopping Cart</h1>
                <div className="cart-page">
                    <div className="cart-items">
                        {cartItems.map(item => (
                            item.product && (
                                <div key={item.product._id} className="cart-item">
                                    <img src={item.product.images[0]} alt={item.product.name} className="cart-item-image" />
                                    <div className="cart-item-details">
                                        <h3>{item.product.name}</h3>
                                        <p>Category: {item.product.category?.name || 'N/A'}</p>
                                        <p className="cart-item-price"><strong>Price:</strong> {formatCurrency(item.product.price)}</p>
                                        {item.product.brand && <p className="cart-item-meta"><strong>Brand:</strong> {item.product.brand}</p>}
                                        {item.product.color && <p className="cart-item-meta"><strong>Color:</strong> {item.product.color}</p>}
                                    </div>
                                    <div className="quantity-controls">
                                        <button className="quantity-btn" onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}>-</button>
                                        <input type="text" className="quantity-input" value={item.quantity} readOnly />
                                        <button className="quantity-btn" onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}>+</button>
                                    </div>
                                    <p className="cart-item-total"><strong>Total: {formatCurrency(item.product.price * item.quantity)}</strong></p>
                                    <button className="remove-btn" onClick={() => handleRemoveItem(item.product._id)}><FiTrash2 /></button>
                                </div>
                            )
                        ))}
                    </div>
                    <div className="order-summary">
                        <h2>Order Summary</h2>
                        <table className="summary-table">
                            <tbody>
                                <tr><td>Subtotal</td><td>{formatCurrency(subtotal)}</td></tr>
                                <tr><td>Delivery Charge ({cartItems.length} items)</td><td>{formatCurrency(deliveryCharge)}</td></tr>
                                <tr><td>Packaging Charge ({totalQuantity} units)</td><td>{formatCurrency(packagingCharge)}</td></tr>
                                <tr><td>GST (3%)</td><td>{formatCurrency(gst)}</td></tr>
                                <tr className="total"><td>Grand Total</td><td>{formatCurrency(grandTotal)}</td></tr>
                            </tbody>
                        </table>
                        <div className="cart-actions">
                            <button className="auth-button" onClick={() => navigate('/checkout')}>🔒 Proceed to Checkout</button>
                            <Link to="/" className="auth-button secondary">Continue Shopping</Link>
                        </div>
                    </div>
                </div>
                
                {cartRecommendations.length > 0 && (
                    <ProductCarousel title="You May Also Like" products={cartRecommendations} />
                )}
                
                <ProductCarousel title="Complete Your Purchase" products={suggestedProducts} />
            </div>
        </>
    );
};

export default CartPage;
