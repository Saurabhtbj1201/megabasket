import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import BannerModal from '../../components/admin/BannerModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import Meta from '../../components/Meta';
import './AdminBannerPage.css';

const AdminBannerPage = () => {
    const [banners, setBanners] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchBanners = async () => {
        try {
            const { data } = await axios.get('/api/banners');
            setBanners(data);
        } catch (error) {
            toast.error('Failed to fetch banners.');
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const filteredBanners = banners.filter(banner =>
        banner.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveBanner = async (formData, bannerId) => {
        setIsSaving(true);
        try {
            const requestConfig = { ...config, headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } };
            if (bannerId) {
                await axios.put(`/api/banners/${bannerId}`, formData, requestConfig);
                toast.success('Banner updated successfully!');
            } else {
                await axios.post('/api/banners', formData, requestConfig);
                toast.success('Banner added successfully!');
            }
            setIsModalOpen(false);
            setEditingBanner(null);
            fetchBanners();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save banner.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (bannerId) => {
        setBannerToDelete(bannerId);
        setShowConfirmModal(true);
    };

    const confirmDeleteBanner = async () => {
        try {
            await axios.delete(`/api/banners/${bannerToDelete}`, config);
            toast.success('Banner deleted successfully!');
            fetchBanners();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete banner.');
        } finally {
            setShowConfirmModal(false);
            setBannerToDelete(null);
        }
    };

    return (
        <>
            <Meta title="Admin: Banner Management" noIndex={true} />
            <div>
                <div className="banner-page-header">
                    <h1>Banner Management</h1>
                    <div className="search-and-add">
                        <input
                            type="text"
                            placeholder="Search banners..."
                            className="admin-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="auth-button" onClick={() => { setEditingBanner(null); setIsModalOpen(true); }}>Add New Banner</button>
                    </div>
                </div>
                <div className="banner-list">
                    {filteredBanners.map(banner => (
                        <div key={banner._id} className="banner-card">
                            <img src={banner.image} alt={banner.title} />
                            <div className="banner-info">
                                <h3>{banner.title}</h3>
                                <p>{banner.description}</p>
                                {banner.product ? (
                                    <span className="banner-link">Links to Product: {banner.product.name}</span>
                                ) : banner.category ? (
                                    <span className="banner-link">Links to Category: {banner.category.name}</span>
                                ) : null}
                            </div>
                            <div className="banner-actions">
                                <button onClick={() => { setEditingBanner(banner); setIsModalOpen(true); }}><FiEdit /></button>
                                <button onClick={() => handleDeleteClick(banner._id)}><FiTrash2 /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <BannerModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveBanner}
                    banner={editingBanner}
                    isSaving={isSaving}
                />
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmDeleteBanner}
                    title="Delete Banner"
                    message="Are you sure you want to delete this banner?"
                />
            </div>
        </>
    );
};

export default AdminBannerPage;
