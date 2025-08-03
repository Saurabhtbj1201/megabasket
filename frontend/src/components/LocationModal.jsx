import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './LocationModal.css';

const LocationModal = ({ isOpen, onClose, onSelectAddress }) => {
    const { userInfo, updateUserInfo } = useAuth();
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [formData, setFormData] = useState(null);
    const [savedAddresses, setSavedAddresses] = useState([]);

    useEffect(() => {
        const fetchAddresses = async () => {
            if (userInfo?.token) {
                try {
                    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                    const { data } = await axios.get('/api/users/profile', config);
                    setSavedAddresses(data.addresses || []);
                } catch (error) {
                    toast.error("Could not fetch saved addresses.");
                }
            }
        };

        if (isOpen) {
            setView('list');
            setFormData(null);
            fetchAddresses();
        }
    }, [isOpen, userInfo?.token]);

    if (!isOpen) return null;

    const handleFetchLocation = () => {
        toast.info('Fetching your location...');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
                const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;
                try {
                    const { data } = await axios.get(url);
                    const components = data.results[0].components;
                    setFormData({
                        name: userInfo.name,
                        phone: userInfo.phone || '',
                        street: `${components.road || ''}, ${components.neighbourhood || ''}`.trim(),
                        city: components.city || components.town || '',
                        district: components.county || '',
                        state: components.state || '',
                        zip: components.postcode || '',
                        country: components.country || '',
                    });
                    setView('form');
                } catch (error) {
                    toast.error('Could not get address from coordinates.');
                }
            },
            () => toast.error('Unable to retrieve your location. Please enable location services.')
        );
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.post('/api/users/profile/address', formData, config);
            updateUserInfo({ addresses: data });
            onSelectAddress(formData);
            toast.success('Location saved successfully!');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save address.');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {view === 'list' && (
                    <div>
                        <h2>Select a Location</h2>
                        <div className="location-options">
                            <button className="auth-button" onClick={handleFetchLocation}>Use my current location</button>
                        </div>
                        <div className="saved-addresses-list">
                            <h3>Saved Addresses</h3>
                            {savedAddresses.length > 0 ? (
                                savedAddresses.map(addr => (
                                    <div key={addr._id} className="saved-address-item" onClick={() => onSelectAddress(addr)}>
                                        <strong>{addr.name}</strong>
                                        <p>{addr.street}, {addr.city}, {addr.state} - {addr.zip}</p>
                                    </div>
                                ))
                            ) : (
                                <p>You have no saved addresses.</p>
                            )}
                        </div>
                    </div>
                )}
                {view === 'form' && formData && (
                     <div>
                        <h2>Confirm Your Address</h2>
                        <form onSubmit={handleSaveAddress}>
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
                                <button type="submit" className="auth-button">Save Address</button>
                                <button type="button" onClick={() => setView('list')} className="auth-button secondary">Back</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationModal;
