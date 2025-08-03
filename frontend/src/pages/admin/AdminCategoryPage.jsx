import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import CategoryModal from '../../components/admin/CategoryModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import Meta from '../../components/Meta';
import './AdminCategoryPage.css';

const AdminCategoryPage = () => {
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/categories');
            setCategories(data);
        } catch (error) {
            toast.error('Failed to fetch categories.');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveCategory = async (formData, categoryId) => {
        setIsSaving(true);
        try {
            const requestConfig = { ...config, headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } };
            if (categoryId) {
                await axios.put(`/api/categories/${categoryId}`, formData, requestConfig);
                toast.success('Category updated successfully!');
            } else {
                await axios.post('/api/categories', formData, requestConfig);
                toast.success('Category added successfully!');
            }
            setIsModalOpen(false);
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save category.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (categoryId) => {
        setCategoryToDelete(categoryId);
        setShowConfirmModal(true);
    };

    const confirmDeleteCategory = async () => {
        try {
            await axios.delete(`/api/categories/${categoryToDelete}`, config);
            toast.success('Category deleted successfully!');
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete category.');
        } finally {
            setShowConfirmModal(false);
            setCategoryToDelete(null);
        }
    };

    return (
        <>
            <Meta title="Admin: Category Management" noIndex={true} />
            <div>
                <div className="category-page-header">
                    <h1>Category Management</h1>
                    <div className="search-and-add">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="admin-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="auth-button" onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>Add New Category</button>
                    </div>
                </div>
                <div className="admin-category-grid">
                    {filteredCategories.map(category => (
                        <div key={category._id} className="category-card">
                            <img src={category.image} alt={category.name} />
                            <h3>{category.name}</h3>
                            <div className="category-actions">
                                <button onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}><FiEdit /></button>
                                <button onClick={() => handleDeleteClick(category._id)}><FiTrash2 /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <CategoryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCategory}
                    category={editingCategory}
                    isSaving={isSaving}
                />
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmDeleteCategory}
                    title="Delete Category"
                    message="Are you sure you want to delete this category?"
                />
            </div>
        </>
    );
};

export default AdminCategoryPage;
