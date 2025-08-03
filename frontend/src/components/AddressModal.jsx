import React, { useState, useEffect } from 'react';
import './AddressModal.css';

const AddressModal = ({ isOpen, onClose, onSave, address, isSaving }) => {
    const [formData, setFormData] = useState({
        name: '', phone: '', street: '', city: '', landmark: '', district: '', state: '', zip: '', country: 'India'
    });

    useEffect(() => {
        if (address) {
            setFormData(address);
        } else {
            setFormData({ name: '', phone: '', street: '', city: '', landmark: '', district: '', state: '', zip: '', country: 'India' });
        }
    }, [address, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{address ? 'Edit Address' : 'Add New Address'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group"><label>Full Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Mobile Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /></div>
                        <div className="form-group"><label>House No, Street</label><input type="text" name="street" value={formData.street} onChange={handleChange} required /></div>
                        <div className="form-group"><label>City/Town</label><input type="text" name="city" value={formData.city} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Landmark (Optional)</label><input type="text" name="landmark" value={formData.landmark} onChange={handleChange} /></div>
                        <div className="form-group"><label>District</label><input type="text" name="district" value={formData.district} onChange={handleChange} required /></div>
                        <div className="form-group"><label>State</label><input type="text" name="state" value={formData.state} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Postal Code</label><input type="text" name="zip" value={formData.zip} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Country</label><input type="text" name="country" value={formData.country} onChange={handleChange} required /></div>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="auth-button" disabled={isSaving}>
                            {isSaving ? <><span className="spinner"></span> Saving...</> : 'Save Address'}
                        </button>
                        <button type="button" onClick={onClose} className="auth-button secondary" disabled={isSaving}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressModal;
