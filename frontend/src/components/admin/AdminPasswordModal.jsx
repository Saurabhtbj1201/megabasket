import React, { useState } from 'react';
import PasswordField from '../PasswordField';
import '../AddressModal.css'; // Reusing styles for consistency

const AdminPasswordModal = ({ isOpen, onClose, onSave }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ oldPassword, newPassword, confirmPassword });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Change Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Old Password</label>
                        <PasswordField value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <PasswordField value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <PasswordField value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="auth-button">Update Password</button>
                        <button type="button" onClick={onClose} className="auth-button secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminPasswordModal;
