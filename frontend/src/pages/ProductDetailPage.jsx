import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import ProductCarousel from '../components/ProductCarousel';
import Meta from '../components/Meta';
import './ProductDetailPage.css';
import './AllCategoriesPage.css'; // For shared status styles

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userInfo, setCartCount } = useAuth();
    const [product, setProduct] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [mainImage, setMainImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`/api/products/${id}`);
                setProduct(data);
                setMainImage(data.images[0]);

                // Fetch similar products
                const { data: similarData } = await axios.get(`/api/products/category/${data.category._id}`);
                setSimilarProducts(similarData.filter(p => p._id !== data._id));
            } catch (error) {
                toast.error('Could not fetch product details.');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();

        // Track recently visited
        if (id) {
            const visited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
            const updatedVisited = [id, ...visited.filter(visitedId => visitedId !== id)].slice(0, 10);
            localStorage.setItem('recentlyVisited', JSON.stringify(updatedVisited));
        }
    }, [id, navigate]);

    useEffect(() => {
        // Fetch recommended products for logged-in users
        const fetchRecommended = async () => {
            if (userInfo) {
                const { data } = await axios.get('/api/products/top-offers');
                setRecommendedProducts(data.sort(() => 0.5 - Math.random()));
            }
        };
        fetchRecommended();
    }, [userInfo]);

    const increaseQuantity = () => {
        // Add guard clauses for robustness
        if (!product || typeof product.stock === 'undefined') {
            toast.error("Stock information is currently unavailable.");
            return;
        }

        if (quantity < product.stock) {
            setQuantity(prevQuantity => prevQuantity + 1);
        } else {
            toast.warn(`Only ${product.stock} items available in stock.`);
        }
    };

    const decreaseQuantity = () => {
        // No dependency on product, but good practice to keep handlers consistent
        if (quantity > 1) {
            setQuantity(prevQuantity => prevQuantity - 1);
        }
    };

    const handleAddToCart = async () => {
        if (!userInfo) {
            localStorage.setItem('productToAdd', product._id);
            toast.info('Please log in to add items to your cart.');
            navigate('/login');
            return false;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.post('/api/cart', { productId: product._id, quantity }, config);
            const count = data.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
            toast.success(`${product.name} added to cart!`);
            return true;
        } catch (error) {
            toast.error('Failed to add item to cart.');
            return false;
        }
    };

    const handleBuyNow = async () => {
        const added = await handleAddToCart();
        if (added) {
            navigate('/cart');
        }
    };

    if (loading) {
        return (
            <div className="page-status-container">
                <div className="loader"></div>
                <p className="loading-text">Loading Product...</p>
            </div>
        );
    }

    if (!product) {
        return <div className="container"><p>Product not found.</p></div>;
    }

    const finalPrice = product.price - (product.price * product.discount / 100);

    return (
        <>
            <Meta 
                title={`${product.name} | MegaBasket`}
                description={product.description.substring(0, 160)}
                keywords={`${product.name}, ${product.category.name}, ${product.brand}, ${product.tags.join(', ')}`}
                ogImage={product.images[0]}
                ogType="product"
            />
            <div className="container">
                <div className="product-detail-page">
                    <section className="product-main-section">
                        <div className="product-gallery">
                            <div className="main-image-container">
                                <img src={mainImage} alt={product.name} />
                            </div>
                            <div className="thumbnail-list">
                                {product.images.map((img, index) => (
                                    <div
                                        key={index}
                                        className={`thumbnail-item ${mainImage === img ? 'active' : ''}`}
                                        onClick={() => setMainImage(img)}
                                    >
                                        <img src={img} alt={`Thumbnail ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="product-info-details">
                            <h1>{product.name}</h1>
                            <p className="short-description">{product.description.substring(0, 150)}...</p>
                            <div className="price-details">
                                <span className="final-price">{formatCurrency(finalPrice)}</span>
                                {product.discount > 0 && (
                                    <>
                                        <span className="mrp">{formatCurrency(product.price)}</span>
                                        <span className="discount">{product.discount}% off</span>
                                    </>
                                )}
                            </div>
                            <div className="quantity-selector">
                                <label>Quantity:</label>
                                <button className="quantity-btn" onClick={decreaseQuantity}>-</button>
                                <input className="quantity-input" type="text" value={quantity} readOnly />
                                <button className="quantity-btn" onClick={increaseQuantity}>+</button>
                            </div>
                            <div className="action-buttons">
                                <button className="auth-button" onClick={handleAddToCart}>Add to Cart</button>
                                <button className="auth-button buy-now-btn" onClick={handleBuyNow}>Buy Now</button>
                            </div>
                        </div>
                    </section>

                    {product.stock < 10 && (
                        <section className="stock-alert-bar">
                            <p>Hurry up! Only a few items left in stock.</p>
                        </section>
                    )}

                    <section className="detailed-info-section">
                        {(product.brand || product.color) && (
                            <div className="product-meta-details" style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid #eee' }}>
                                {product.brand && <p><strong>Brand:</strong> {product.brand}</p>}
                                {product.color && <p><strong>Color:</strong> {product.color}</p>}
                            </div>
                        )}
                        <h2>Full Description</h2>
                        <p>{product.description}</p>

                        <h2>Specifications</h2>
                        <table className="specifications-table">
                            <tbody>
                                {product.specifications.map((spec, index) => (
                                    <tr key={index}>
                                        <td>{spec.key}</td>
                                        <td>{spec.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <h2>Tags</h2>
                        <div className="tags-container">
                            {product.tags.map((tag, index) => (
                                <span key={index} className="tag-item">{tag}</span>
                            ))}
                        </div>

                        <div className="action-buttons">
                            <button className="auth-button" onClick={handleAddToCart}>Add to Cart</button>
                            <button className="auth-button buy-now-btn" onClick={handleBuyNow}>Buy Now</button>
                        </div>
                    </section>

                    <ProductCarousel title="From the Same Category" products={similarProducts} />
                    {userInfo && <ProductCarousel title="Recommended For You" products={recommendedProducts} />}
                </div>
            </div>
        </>
    );
};

export default ProductDetailPage;
