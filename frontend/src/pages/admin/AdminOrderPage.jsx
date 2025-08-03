import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatCurrency } from '../../utils/formatCurrency';
import Meta from '../../components/Meta';
import './AdminOrderPage.css';

const AdminOrderPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Order Received');

    const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get('/api/orders', config);
            setOrders(data);
        } catch (error) {
            toast.error('Failed to fetch orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId, status) => {
        try {
            await axios.put(`/api/orders/${orderId}/status`, { status }, config);
            toast.success('Order status updated!');
            fetchOrders(); // Refresh the list
        } catch (error) {
            toast.error('Failed to update order status.');
        }
    };

    const orderStatuses = ["Order Received", "Processing", "Order Dispatched", "Shipped", "In Transit", "Delivered", "Cancelled", "All"];

    const filteredOrders = useMemo(() => {
        if (activeTab === 'All') return orders;
        return orders.filter(order => order.status === activeTab);
    }, [orders, activeTab]);

    const orderCounts = useMemo(() => {
        const counts = {};
        orderStatuses.forEach(status => {
            if (status === 'All') {
                counts[status] = orders.length;
            } else {
                counts[status] = orders.filter(order => order.status === status).length;
            }
        });
        return counts;
    }, [orders]);

    if (loading) return <p>Loading orders...</p>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'var(--success-color)';
            case 'Shipped':
            case 'In Transit':
            case 'Order Dispatched':
                return 'var(--primary-color)';
            case 'Processing':
                return 'var(--warning-color)';
            case 'Cancelled':
                return 'var(--danger-color)';
            default:
                return 'var(--secondary-color)';
        }
    };

    return (
        <>
            <Meta title="Admin: Order Management" noIndex={true} />
            <div>
                <div className="order-page-header">
                    <h1>Order Management</h1>
                </div>
                <div className="tabs-container">
                    {orderStatuses.map(status => (
                        <button
                            key={status}
                            className={`tab-btn ${activeTab === status ? 'active' : ''}`}
                            onClick={() => setActiveTab(status)}
                        >
                            {status} <span className="tab-count">{orderCounts[status]}</span>
                        </button>
                    ))}
                </div>
                <div className="order-list" style={{ paddingTop: '2rem' }}>
                    {filteredOrders.map(order => (
                        <div key={order._id} className="order-list-item">
                            <div className="order-list-header">
                                <div><strong>Order ID:</strong> {order._id}</div>
                                <div><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</div>
                                <div><strong>Customer:</strong> {order.user?.name || 'N/A'}</div>
                                <div><strong>Total:</strong> {formatCurrency(order.totalPrice)}</div>
                            </div>
                            <div className="order-list-body">
                                <div>
                                    <div className="order-customer-info">
                                        <h4>Shipping Details</h4>
                                        <p><strong>{order.shippingAddress.name}</strong></p>
                                        <p>{order.shippingAddress.phone}</p>
                                        <p>{`${order.shippingAddress.street}, ${order.shippingAddress.city}`}</p>
                                    </div>
                                    <div className="order-products-list">
                                        <h4>Items</h4>
                                        {order.orderItems.map(item => (
                                            <div key={item.product} className="order-product-item">
                                                <img src={item.image} alt={item.name} />
                                                <span>{item.name} (x{item.qty})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4>Payment & Status</h4>
                                    <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                                    <p><strong>Subtotal:</strong> {formatCurrency(order.itemsPrice)}</p>
                                    <p><strong>Shipping & Charges:</strong> {formatCurrency(order.shippingPrice)}</p>
                                    <p><strong>GST:</strong> {formatCurrency(order.taxPrice)}</p>
                                    <hr />
                                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <strong>Status:</strong>
                                        <select
                                            className="order-status-select"
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            style={{ borderColor: getStatusColor(order.status), color: getStatusColor(order.status) }}
                                        >
                                            <option value="Order Received">Order Received</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Order Dispatched">Order Dispatched</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="In Transit">In Transit</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default AdminOrderPage;
