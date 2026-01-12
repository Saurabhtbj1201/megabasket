import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEye, FiShoppingCart } from 'react-icons/fi';
import { formatCurrency } from '../utils/formatCurrency';
import { trackAddToCart } from '../utils/eventTracker';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { userInfo, setCartCount } = useAuth();
    const navigate = useNavigate();

    if (!product) return null;

    const finalPrice = product.price - (product.price * product.discount / 100);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        if (!userInfo) {
            localStorage.setItem('productToAdd', product._id);
            toast.info('Please log in to add items to your cart.');
            navigate('/login');
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.post('/api/cart', { productId: product._id }, config);
            const count = data.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
            
            // Track add to cart event
            await trackAddToCart(product._id, product.price, 1);
            
            toast.success(`${product.name} added to cart!`);
        } catch (error) {
            toast.error('Failed to add item to cart.');
        }
    };

    return (
        <Link to={`/product/${product._id}`} className="product-card">
            {product.stock <= 10 && <div className="stock-tag">Few left</div>}
            {product.discount >= 20 && <div className="best-deal-tag">Best Deal</div>}
            <div className="product-image-container">
                <img src={product.images[0]} alt={product.name} className="product-image" loading="lazy" />
            </div>
            <div className="product-info">
                <h4 className="product-title">{product.name}</h4>
                <p className="product-description">{product.description}</p>
                <div className="product-price">
                    <span>{formatCurrency(finalPrice)}</span>
                    {product.discount > 0 && (
                        <>
                            <span className="mrp">{formatCurrency(product.price)}</span>
                            <span className="discount">{product.discount}% off</span>
                        </>
                    )}
                </div>
                <div className="product-actions">
                    <button className="action-btn view-btn" onClick={(e) => { e.preventDefault(); navigate(`/product/${product._id}`); }}>
                        <FiEye /> View
                    </button>
                    <button className="action-btn" onClick={handleAddToCart}>
                        <FiShoppingCart /> Add
                    </button>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
