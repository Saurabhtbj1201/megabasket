import React from 'react';
import '../LocationModal.css'; // Reusing styles

const UserOrdersModal = ({ isOpen, onClose, orders }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content user-orders-modal" onClick={(e) => e.stopPropagation()}>
                <h2>User Orders</h2>
                {orders && orders.length > 0 ? (
                    orders.map(order => (
                        <div key={order._id} className="order-item">
                            <p><strong>Order ID:</strong> {order._id}</p>
                            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                            <p><strong>Total:</strong> ${order.totalPrice.toFixed(2)}</p>
                            <p><strong>Status:</strong> {order.status}</p>
                        </div>
                    ))
                ) : (
                    <p>This user has no orders.</p>
                )}
                <div className="modal-actions">
                    <button onClick={onClose} className="auth-button secondary">Close</button>
                </div>
            </div>
        </div>
    );
};

export default UserOrdersModal;
