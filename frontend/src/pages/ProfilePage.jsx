import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import PasswordField from '../components/PasswordField';
import AddressModal from '../components/AddressModal';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { formatCurrency } from '../utils/formatCurrency';
import Meta from '../components/Meta';
import './ProfilePage.css';
import { useSearchParams } from 'react-router-dom';
import './AllCategoriesPage.css'; // For shared status styles
import ProductCard from '../components/ProductCard';

const ProfilePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
    const { userInfo, updateUserInfo } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeActivityTab, setActiveActivityTab] = useState('visited');
    const [recentlyVisited, setRecentlyVisited] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [addresses, setAddresses] = useState([]);
    const [orders, setOrders] = useState([]);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Image crop states
    const [upImg, setUpImg] = useState();
    const [crop, setCrop] = useState();
    const [croppedImageFile, setCroppedImageFile] = useState(null);
    const imgRef = useRef(null);

    const token = userInfo?.token;

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('/api/users/profile', config);
                setName(data.name || '');
                setEmail(data.email || '');
                setPhone(data.phone || '');
                setProfilePicture(data.profilePicture || '');
                setAddresses(data.addresses || []);
            } catch (error) {
                toast.error("Failed to fetch profile data.");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfileData();
        }
    }, [token]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('/api/orders/myorders', config);
                setOrders(data);
            } catch (error) {
                toast.error('Could not fetch order history.');
            }
        };
        if (token && activeTab === 'orders') {
            fetchOrders();
        }
    }, [token, activeTab]);

    useEffect(() => {
        const fetchActivityData = async () => {
            if (activeTab === 'activity' && activeActivityTab === 'visited') {
                setActivityLoading(true);
                const visitedIds = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
                if (visitedIds.length > 0) {
                    try {
                        // This assumes you have an endpoint that can fetch multiple products by IDs
                        // If not, you'd fetch all and filter, or fetch one by one.
                        const { data: allProducts } = await axios.get('/api/products');
                        const visitedProducts = allProducts.filter(p => visitedIds.includes(p._id));
                        // Preserve the order from recentlyVisited
                        const orderedVisitedProducts = visitedIds
                            .map(id => visitedProducts.find(p => p._id === id))
                            .filter(p => p); // Filter out any products that might not have been found
                        setRecentlyVisited(orderedVisitedProducts);
                    } catch (error) {
                        toast.error("Could not fetch recently visited products.");
                    }
                }
                setActivityLoading(false);
            }
        };
        fetchActivityData();
    }, [activeTab, activeActivityTab]);

    const handleSaveAddress = async (addressData) => {
        setIsSavingAddress(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            let response;
            if (editingAddress) {
                // Update existing address
                response = await axios.put(`/api/users/profile/address/${editingAddress._id}`, addressData, config);
                toast.success('Address updated successfully!');
            } else {
                // Add new address
                response = await axios.post('/api/users/profile/address', addressData, config);
                toast.success('Address added successfully!');
            }
            setAddresses(response.data);
            updateUserInfo({ addresses: response.data });
            setIsAddressModalOpen(false);
            setEditingAddress(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save address.');
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`/api/users/profile/address/${addressId}`, config);
                const updatedAddresses = addresses.filter(addr => addr._id !== addressId);
                setAddresses(updatedAddresses);
                updateUserInfo({ addresses: updatedAddresses });
                toast.success('Address deleted successfully!');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete address.');
            }
        }
    };

    function onSelectFile(e) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Makes crop preview update between images.
            const reader = new FileReader();
            reader.addEventListener('load', () => setUpImg(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    function onImageLoad(e) {
        imgRef.current = e.currentTarget;
        const { width, height } = e.currentTarget;
        const crop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height);
        setCrop(crop);
    }

    const getCroppedImg = () => {
        const image = imgRef.current;
        if (!image || !crop || !crop.width || !crop.height) return;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
        const pixelRatio = window.devicePixelRatio;
        canvas.width = crop.width * pixelRatio;
        canvas.height = crop.height * pixelRatio;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
        
        canvas.toBlob((blob) => {
            if (blob) {
                setCroppedImageFile(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
                setProfilePicture(URL.createObjectURL(blob));
            }
            setUpImg(null); // Close modal
        }, 'image/jpeg', 1);
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('phone', phone);
        if (croppedImageFile) {
            formData.append('profilePicture', croppedImageFile);
        }

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } };
            const { data } = await axios.put('/api/users/profile', formData, config);
            updateUserInfo(data);
            toast.success('Profile updated successfully!');
            setIsEditing(false);
            setCroppedImageFile(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed.');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return toast.error('New passwords do not match.');
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put('/api/users/profile/password', { oldPassword, newPassword }, config);
            toast.success(data.message);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password change failed.');
        }
    };

    const renderActivityContent = () => {
        switch (activeActivityTab) {
            case 'visited':
                return (
                    <div>
                        <h3>Recently Visited Products</h3>
                        {activityLoading ? (
                            <p>Loading visited products...</p>
                        ) : recentlyVisited.length > 0 ? (
                            <div className="visited-products-grid">
                                {recentlyVisited.map(product => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <p>You have not visited any products recently.</p>
                        )}
                    </div>
                );
            case 'devices':
                return (
                    <div>
                        <h3>Logged-in Devices</h3>
                        <p>This feature is coming soon. You will be able to see and manage all devices logged into your account here.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderDetailsContent = () => {
        if (isEditing) {
            return (
                <div>
                    <h2>Edit Details</h2>
                    <div className="profile-picture-section">
                        <img key={profilePicture} src={profilePicture || 'https://via.placeholder.com/120'} alt="Profile" className="profile-picture" />
                        <input type="file" id="profilePicture" onChange={onSelectFile} accept="image/*" />
                        <label htmlFor="profilePicture">Change Picture</label>
                    </div>
                    <form onSubmit={handleSaveChanges} className="auth-form" style={{ boxShadow: 'none', padding: 0, maxWidth: '100%' }}>
                        <div className="form-group"><label>Full Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
                        <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                        <div className="form-group"><label>Mobile</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                        <button type="submit" className="auth-button">Save Changes</button>
                        <button type="button" onClick={() => setIsEditing(false)} className="auth-button" style={{ background: 'var(--secondary-color)', marginTop: '1rem' }}>Cancel</button>
                    </form>
                </div>
            );
        }
        return (
            <div>
                <h2>Personal Details</h2>
                <div className="profile-picture-section">
                    <img key={profilePicture} src={profilePicture || 'https://via.placeholder.com/120'} alt="Profile" className="profile-picture" />
                </div>
                <div className="profile-details-display">
                    <strong>Full Name:</strong><p>{name}</p>
                    <strong>Email:</strong><p>{email}</p>
                    <strong>Mobile:</strong><p>{phone || 'Not provided'}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="auth-button" style={{ marginTop: '2rem' }}>Update Profile</button>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'details': return renderDetailsContent();
            case 'addresses': return (
                <div>
                    <h2>My Addresses</h2>
                    <div className="address-list">
                        {addresses.length === 0 ? <p>You have no saved addresses.</p> : addresses.map(addr => (
                            <div key={addr._id} className="address-item">
                                <div className="address-details">
                                    <strong>{addr.name}</strong> ({addr.phone})
                                    <p>{addr.street}, {addr.landmark ? `${addr.landmark}, ` : ''}{addr.city}, {addr.district}</p>
                                    <p>{addr.state}, {addr.zip}, {addr.country}</p>
                                </div>
                                <div className="address-actions">
                                    <button onClick={() => { setEditingAddress(addr); setIsAddressModalOpen(true); }}><FiEdit /></button>
                                    <button onClick={() => handleDeleteAddress(addr._id)}><FiTrash2 /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }} className="auth-button" style={{ marginTop: '1rem' }}>Add New Address</button>
                </div>
            );
            case 'orders': return (
                <div>
                    <h2>My Orders</h2>
                    <div className="order-list">
                        {orders.length === 0 ? <p>You have no orders.</p> : orders.map(order => (
                            <div key={order._id} className="order-item">
                                <div className="order-item-header">
                                    <span><strong>Order ID:</strong> {order._id}</span>
                                    <span><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p><strong>Total:</strong> {formatCurrency(order.totalPrice)}</p>
                                <p><strong>Status:</strong> <span style={{ color: order.status === 'Delivered' ? 'green' : 'orange' }}>{order.status}</span></p>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'activity': return (
                <div>
                    <h2>My Activity</h2>
                    <div className="activity-nav">
                        <button onClick={() => setActiveActivityTab('visited')} className={activeActivityTab === 'visited' ? 'active' : ''}>Recently Visited</button>
                        <button onClick={() => setActiveActivityTab('devices')} className={activeActivityTab === 'devices' ? 'active' : ''}>Logged-in Devices</button>
                    </div>
                    <div className="activity-content">
                        {renderActivityContent()}
                    </div>
                </div>
            );
            case 'password': return (
                <div>
                    <h2>Change Password</h2>
                    <form onSubmit={handlePasswordChange} className="auth-form" style={{ boxShadow: 'none', padding: 0, maxWidth: '100%' }}>
                        <div className="form-group"><label>Old Password</label><PasswordField value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} /></div>
                        <div className="form-group"><label>New Password</label><PasswordField value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                        <div className="form-group"><label>Confirm New Password</label><PasswordField value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                        <button type="submit" className="auth-button">Change Password</button>
                    </form>
                </div>
            );
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="preloader">
                <p>Loading Cart...</p>
            </div>
        );
    }

    return (
        <>
            <Meta title="My Profile | MegaBasket" description="Manage your profile, addresses, and view your order history on MegaBasket." noIndex={true} />
            <div className="container">
                <h1>My Profile</h1>
                <AddressModal
                    isOpen={isAddressModalOpen}
                    onClose={() => setIsAddressModalOpen(false)}
                    onSave={handleSaveAddress}
                    address={editingAddress}
                    isSaving={isSavingAddress}
                />
                {upImg && (
                    <div className="crop-modal-overlay">
                        <div className="crop-modal-content">
                            <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1}>
                                <img src={upImg} onLoad={onImageLoad} alt="Crop me" />
                            </ReactCrop>
                            <button onClick={getCroppedImg} className="auth-button" style={{ marginTop: '1rem' }}>Crop</button>
                        </div>
                    </div>
                )}
                <div className="profile-container">
                    <nav className="profile-nav">
                        <ul>
                            <li><button onClick={() => setActiveTab('details')} className={activeTab === 'details' ? 'active' : ''}>Personal Details</button></li>
                            <li><button onClick={() => setActiveTab('addresses')} className={activeTab === 'addresses' ? 'active' : ''}>My Addresses</button></li>
                            <li><button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>My Orders</button></li>
                            <li><button onClick={() => setActiveTab('activity')} className={activeTab === 'activity' ? 'active' : ''}>My Activity</button></li>
                            <li><button onClick={() => setActiveTab('password')} className={activeTab === 'password' ? 'active' : ''}>Change Password</button></li>
                        </ul>
                    </nav>
                    <div className="profile-content">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfilePage;
