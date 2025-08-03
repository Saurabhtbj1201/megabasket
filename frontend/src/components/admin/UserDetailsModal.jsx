import React from 'react';
import '../LocationModal.css'; // Reusing styles

const UserDetailsModal = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content user-details-modal" onClick={(e) => e.stopPropagation()}>
                <h2>User Details</h2>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                <hr />
                <h3>Saved Addresses</h3>
                {user.addresses && user.addresses.length > 0 ? (
                    user.addresses.map(addr => (
                        <div key={addr._id} className="address-item">
                            <strong>{addr.name}</strong> ({addr.phone})
                            <p>{addr.street}, {addr.city}, {addr.district}</p>
                            <p>{addr.state}, {addr.zip}, {addr.country}</p>
                        </div>
                    ))
                ) : (
                    <p>No saved addresses.</p>
                )}
                <div className="modal-actions">
                    <button onClick={onClose} className="auth-button secondary">Close</button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
