import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content confirmation-modal">
                <h2>{title || 'Confirm Action'}</h2>
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onConfirm} className="auth-button btn-danger">Confirm</button>
                    <button onClick={onClose} className="auth-button secondary">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
