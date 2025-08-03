import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2, FiPlusCircle } from 'react-icons/fi';
import SubCategoryModal from '../../components/admin/SubCategoryModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import Meta from '../../components/Meta';
import './AdminCategoryPage.css'; // Reusing styles

const AdminSubCategoryPage = () => {
    const [subCategories, setSubCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [subCategoryToDelete, setSubCategoryToDelete] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
        try {
            const [subCategoriesRes, categoriesRes] = await Promise.all([
                axios.get('/api/subcategories'),
                axios.get('/api/categories')
            ]);
            setSubCategories(subCategoriesRes.data);
            setAllCategories(categoriesRes.data);
        } catch (error) {
            toast.error('Failed to fetch data.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSubCategories = useMemo(() => {
        return subCategories
            .filter(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(sub => {
                if (!filterCategory) return true;
                return sub.categories.some(cat => cat._id === filterCategory);
            });
    }, [subCategories, searchTerm, filterCategory]);

    const handleSave = async (formData, subCategoryId) => {
        setIsSaving(true);
        try {
            const requestConfig = { ...config, headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } };
            if (subCategoryId) {
                await axios.put(`/api/subcategories/${subCategoryId}`, formData, requestConfig);
                toast.success('Sub-category updated successfully!');
            } else {
                await axios.post('/api/subcategories', formData, requestConfig);
                toast.success('Sub-category added successfully!');
            }
            setIsModalOpen(false);
            setEditingSubCategory(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save sub-category.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (subCategoryId) => {
        setSubCategoryToDelete(subCategoryId);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/subcategories/${subCategoryToDelete}`, config);
            toast.success('Sub-category deleted successfully!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete sub-category.');
        } finally {
            setShowConfirmModal(false);
            setSubCategoryToDelete(null);
        }
    };

    return (
        <>
            <Meta title="Admin: Sub-Category Management" noIndex={true} />
            <div>
                <div className="category-page-header">
                    <h1>Sub-Category Management</h1>
                    <div className="search-and-add">
                        <input
                            type="text"
                            placeholder="Search sub-categories..."
                            className="admin-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select onChange={(e) => setFilterCategory(e.target.value)} value={filterCategory} className="admin-search-input">
                            <option value="">Filter by Category</option>
                            {allCategories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                        <button className="auth-button" onClick={() => { setEditingSubCategory(null); setIsModalOpen(true); }}>
                            <FiPlusCircle /> Add New
                        </button>
                    </div>
                </div>
                <div className="admin-category-grid">
                    {filteredSubCategories.map(sub => (
                        <div key={sub._id} className="category-card">
                            <img src={sub.image} alt={sub.name} />
                            <h3>{sub.name}</h3>
                            <div className="sub-category-parents">
                                {sub.categories.map(cat => <span key={cat._id} className="badge">{cat.name}</span>)}
                            </div>
                            <div className="category-actions">
                                <button onClick={() => { setEditingSubCategory(sub); setIsModalOpen(true); }}><FiEdit /></button>
                                <button onClick={() => handleDeleteClick(sub._id)}><FiTrash2 /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <SubCategoryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    subCategory={editingSubCategory}
                    allCategories={allCategories}
                    isSaving={isSaving}
                />
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmDelete}
                    title="Delete Sub-Category"
                    message="Are you sure you want to delete this sub-category? This cannot be undone."
                />
            </div>
        </>
    );
};

export default AdminSubCategoryPage;
