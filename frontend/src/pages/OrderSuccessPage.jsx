import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { FiPackage, FiTruck, FiSearch } from 'react-icons/fi';
import Meta from '../components/Meta';
import './OrderSuccessPage.css';
import './AllCategoriesPage.css'; // For shared status styles

const OrderSuccessPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const successSound = useRef(new Audio('/order.mp3'));

    useEffect(() => {
        // Prevent user from going back
        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener('popstate', () => {
            navigate('/', { replace: true });
        });

        const fetchOrder = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                const { data } = await axios.get(`/api/orders/${id}`, config);
                setOrder(data);
                successSound.current.play().catch(e => console.error("Audio play failed:", e));
            } catch (error) {
                toast.error('Could not fetch order details.');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        if (userInfo) {
            fetchOrder();
        }
    }, [id, userInfo, navigate]);

    if (loading) {
        return (
            <div className="preloader">
                <p>Loading Cart...</p>
            </div>
        );
    }
    if (!order) return null;

    const estimatedDeliveryDate = () => {
        const deliveryDays = order.orderItems.length <= 5 ? 4 : 7;
        const date = new Date(order.createdAt);
        date.setDate(date.getDate() + deliveryDays);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <>
            <Meta title="Order Successful! | MegaBasket" description="Your order has been placed successfully. Thank you for shopping with MegaBasket." noIndex={true} />
            <div className="container">
                <div className="order-success-page">
                    <div className="success-animation">
                        <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                    </div>
                    <h1>Thank You for Your Purchase!</h1>
                    <p>Your order has been successfully placed. A confirmation has been sent to your email.</p>

                    <div className="order-details-box">
                        <div className="order-details-header"><strong>Order Summary</strong></div>
                        <div className="order-details-content">
                            <div>
                                <p><strong>Order ID:</strong> #{order._id}</p>
                                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                            </div>
                            <div>
                                <p><strong>Total Paid:</strong> {formatCurrency(order.totalPrice)}</p>
                                <p><strong>Estimated Delivery:</strong> {estimatedDeliveryDate()}</p>
                            </div>
                        </div>
                        <div className="order-product-list">
                            {order.orderItems.map(item => (
                                <div key={item.product} className="order-product-item">
                                    <img src={item.image} alt={item.name} />
                                    <div className="order-product-details">
                                        <strong>{item.name}</strong>
                                        <p>Qty: {item.qty}</p>
                                    </div>
                                    <span>{formatCurrency(item.price * item.qty)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="order-details-box">
                        <div className="order-details-header"><strong>Shipping Address</strong></div>
                        <div className="order-details-content" style={{gridTemplateColumns: '1fr'}}>
                            <p><strong>{order.shippingAddress.name}</strong> ({order.shippingAddress.phone})</p>
                            <p>{`${order.shippingAddress.street}, ${order.shippingAddress.landmark ? `${order.shippingAddress.landmark}, ` : ''}${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zip}`}</p>
                        </div>
                    </div>

                    <div className="whats-next">
                        <h2>What’s Next?</h2>
                        <ul>
                            <li><FiPackage size={24} color="var(--primary-color)" /> We are preparing your order for dispatch.</li>
                            <li><FiTruck size={24} color="var(--primary-color)" /> You’ll be notified once it’s shipped.</li>
                            <li><FiSearch size={24} color="var(--primary-color)" /> Track your order anytime from the "My Orders" page.</li>
                        </ul>
                    </div>

                    <div className="success-page-actions">
                        <Link to="/" className="auth-button">Continue Shopping</Link>
                        <Link to="/profile?tab=orders" className="auth-button secondary">Go to My Orders</Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderSuccessPage;
