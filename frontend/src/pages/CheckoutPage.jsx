import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import AddressModal from '../components/AddressModal';
import { FiLock, FiUser, FiPhone, FiHome, FiEdit } from 'react-icons/fi';
import Meta from '../components/Meta';
import './CheckoutPage.css';
import './AllCategoriesPage.css'; // For shared status styles

const CheckoutPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const { userInfo, updateUserInfo, setCartCount } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (userInfo) {
                try {
                    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                    const [cartRes, profileRes] = await Promise.all([
                        axios.get('/api/cart', config),
                        axios.get('/api/users/profile', config)
                    ]);
                    setCartItems(cartRes.data);
                    setAddresses(profileRes.data.addresses || []);
                    if (profileRes.data.addresses?.length > 0) {
                        setSelectedAddressId(profileRes.data.addresses[0]._id);
                    }
                } catch (error) {
                    toast.error('Could not fetch checkout data.');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [userInfo]);

    const selectedAddress = useMemo(() => {
        return addresses.find(addr => addr._id === selectedAddressId);
    }, [selectedAddressId, addresses]);

    const { subtotal, deliveryCharge, packagingCharge, gst, grandTotal } = useMemo(() => {
        const sub = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
        const delivery = 35 * cartItems.length;
        const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        const packaging = 10 * totalQty;
        const gstAmount = sub * 0.03;
        const total = sub + delivery + packaging + gstAmount;
        return { subtotal: sub, deliveryCharge: delivery, packagingCharge: packaging, gst: gstAmount, grandTotal: total };
    }, [cartItems]);

    const estimatedDeliveryDate = useMemo(() => {
        const deliveryDays = cartItems.length <= 5 ? 4 : 7;
        const date = new Date();
        date.setDate(date.getDate() + deliveryDays);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }, [cartItems]);

    const handleSaveAddress = async (addressData) => {
        setIsSavingAddress(true);
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            let data;
            if (editingAddress) {
                const response = await axios.put(`/api/users/profile/address/${editingAddress._id}`, addressData, config);
                data = response.data;
                toast.success('Address updated successfully!');
            } else {
                const response = await axios.post('/api/users/profile/address', addressData, config);
                data = response.data;
                setSelectedAddressId(data[data.length - 1]._id); // Select the newly added address
                toast.success('Address added successfully!');
            }
            setAddresses(data);
            updateUserInfo({ addresses: data });
            setIsAddressModalOpen(false);
            setEditingAddress(null);
        } catch (error) {
            toast.error('Failed to save address.');
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            return toast.error('Please select a delivery address.');
        }
        setIsPlacingOrder(true);
        try {
            const orderData = {
                orderItems: cartItems.map(item => ({
                    name: item.product.name,
                    qty: item.quantity,
                    image: item.product.images[0],
                    price: item.product.price,
                    product: item.product._id,
                })),
                shippingAddress: selectedAddress,
                paymentMethod,
                itemsPrice: subtotal,
                taxPrice: gst,
                shippingPrice: deliveryCharge + packagingCharge,
                totalPrice: grandTotal,
            };
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data: newOrder } = await axios.post('/api/orders', orderData, config);
            toast.success('Order placed successfully!');
            setCartCount(0); // Clear cart count in context
            navigate(`/order/${newOrder._id}`); // Redirect to a confirmation page (to be created)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to place order.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handleEditAddressClick = (e, addr) => {
        e.stopPropagation(); // Prevent the card from being selected
        setEditingAddress(addr);
        setIsAddressModalOpen(true);
    };

    if (loading) {
        return (
            <div className="page-status-container">
                <div className="loader"></div>
                <p className="loading-text">Loading Checkout...</p>
            </div>
        );
    }

    return (
        <>
            <Meta title="Checkout | MegaBasket" description="Complete your purchase securely. Review your order and payment details." noIndex={true} />
            <div className="container">
                <h1 className="checkout-page-title">Checkout</h1>
                <div className="checkout-page">
                    <div className="checkout-left">
                        <div className="checkout-box">
                            <h2>Select Delivery Address</h2>
                            <div className="address-list">
                                {addresses.map(addr => (
                                    <div key={addr._id} className={`address-card ${selectedAddressId === addr._id ? 'selected' : ''}`} onClick={() => setSelectedAddressId(addr._id)}>
                                        <strong>{addr.name}</strong> ({addr.phone})
                                        <p>{addr.street}, {addr.city}, {addr.district}</p>
                                        <p>{addr.state}, {addr.zip}, {addr.country}</p>
                                        <button className="edit-btn" onClick={(e) => handleEditAddressClick(e, addr)}><FiEdit /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }} className="auth-button" style={{ marginTop: '1rem', width: 'auto' }}>Add New Address</button>
                        </div>
                        <div className="checkout-box">
                            <h2>Select Payment Method</h2>
                            <div className="payment-method-list">
                                <div className={`payment-method-card ${paymentMethod === 'UPI' ? 'selected' : ''}`} onClick={() => setPaymentMethod('UPI')}>
                                    <input type="radio" name="paymentMethod" value="UPI" checked={paymentMethod === 'UPI'} readOnly />
                                    <label>UPI</label>
                                </div>
                                <div className={`payment-method-card ${paymentMethod === 'Card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('Card')}>
                                    <input type="radio" name="paymentMethod" value="Card" checked={paymentMethod === 'Card'} readOnly />
                                    <label>Credit/Debit Card</label>
                                </div>
                                <div className={`payment-method-card ${paymentMethod === 'NetBanking' ? 'selected' : ''}`} onClick={() => setPaymentMethod('NetBanking')}>
                                    <input type="radio" name="paymentMethod" value="NetBanking" checked={paymentMethod === 'NetBanking'} readOnly />
                                    <label>Net Banking</label>
                                </div>
                                <div className={`payment-method-card ${paymentMethod === 'COD' ? 'selected' : ''}`} onClick={() => setPaymentMethod('COD')}>
                                    <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} readOnly />
                                    <label>Cash on Delivery (COD)</label>
                                </div>
                            </div>
                        </div>
                        <div className="checkout-box">
                            <h2>Delivery Details</h2>
                            {selectedAddress ? (
                                <div className="delivery-info">
                                    <p><FiUser /> <strong>Deliver to:</strong> {selectedAddress.name}</p>
                                    <p><FiPhone /> <strong>Contact:</strong> {selectedAddress.phone}</p>
                                    <p><FiHome /> <strong>Address:</strong> {`${selectedAddress.street}, ${selectedAddress.landmark ? `${selectedAddress.landmark}, ` : ''}${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.zip}`}</p>
                                </div>
                            ) : (
                                <p>Please select or add a delivery address.</p>
                            )}
                            <p className="delivery-date">Estimated Delivery by: {estimatedDeliveryDate}</p>
                        </div>
                    </div>
                    <div className="checkout-summary">
                        <div className="checkout-box">
                            <h2>Order Summary</h2>
                            <div className="summary-product-list">
                                {cartItems.map(item => (
                                    <div key={item.product._id} className="summary-product-item">
                                        <img src={item.product.images[0]} alt={item.product.name} />
                                        <div className="summary-product-details">
                                            <strong>{item.product.name}</strong>
                                            {item.product.brand && <p className="summary-product-meta">Brand: {item.product.brand}</p>}
                                            {item.product.color && <p className="summary-product-meta">Color: {item.product.color}</p>}
                                            <p>Qty: {item.quantity}</p>
                                        </div>
                                        <span>{formatCurrency(item.product.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <table className="summary-table">
                                <tbody>
                                    <tr><td>Subtotal</td><td>{formatCurrency(subtotal)}</td></tr>
                                    <tr><td>Delivery Charge</td><td>{formatCurrency(deliveryCharge)}</td></tr>
                                    <tr><td>Packaging Charge</td><td>{formatCurrency(packagingCharge)}</td></tr>
                                    <tr><td>GST (3%)</td><td>{formatCurrency(gst)}</td></tr>
                                    <tr className="total"><td>Grand Total</td><td>{formatCurrency(grandTotal)}</td></tr>
                                </tbody>
                            </table>
                            <div className="checkout-actions">
                                {paymentMethod === 'COD' ? (
                                    <button className="auth-button payment-btn" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                                        {isPlacingOrder ? <><span className="spinner"></span> Placing Order...</> : 'Place Order'}
                                    </button>
                                ) : (
                                    <button className="auth-button payment-btn"><FiLock /> Continue to Payment</button>
                                )}
                                <button onClick={() => navigate('/cart')} className="auth-button secondary">Back to Cart</button>
                            </div>
                        </div>
                    </div>
                </div>
                <AddressModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} onSave={handleSaveAddress} address={editingAddress} isSaving={isSavingAddress} />
            </div>
        </>
    );
};

export default CheckoutPage;
