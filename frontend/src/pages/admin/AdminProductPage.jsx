import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2, FiUpload } from 'react-icons/fi';
import ProductModal from '../../components/admin/ProductModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import BulkImportModal from '../../components/admin/BulkImportModal';
import { formatCurrency } from '../../utils/formatCurrency';
import Meta from '../../components/Meta';
import './AdminProductPage.css';

const AdminProductPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('Published');
    const [filters, setFilters] = useState({ search: '', category: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);

    const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    axios.get('/api/products/admin', config),
                    axios.get('/api/categories')
                ]);
                setProducts(productsRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                toast.error('Failed to fetch data.');
            }
        };
        fetchData();
    }, []);

    const productCounts = useMemo(() => {
        return {
            published: products.filter(p => p.status === 'Published').length,
            draft: products.filter(p => p.status === 'Draft').length,
            hidden: products.filter(p => p.status === 'Hidden').length,
            all: products.length,
        };
    }, [products]);

    const handleSaveProduct = async (formData, productId) => {
        setIsSaving(true);
        try {
            const requestConfig = { ...config, headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } };
            if (productId) {
                await axios.put(`/api/products/${productId}`, formData, requestConfig);
                toast.success('Product updated successfully!');
            } else {
                await axios.post('/api/products', formData, requestConfig);
                toast.success('Product added successfully!');
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            // Refetch products
            const { data } = await axios.get('/api/products/admin', config);
            setProducts(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save product.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (productId) => {
        setProductToDelete(productId);
        setShowConfirmModal(true);
    };

    const confirmDeleteProduct = async () => {
        try {
            await axios.delete(`/api/products/${productToDelete}`, config);
            toast.success('Product deleted successfully!');
            setProducts(products.filter(p => p._id !== productToDelete));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete product.');
        } finally {
            setShowConfirmModal(false);
            setProductToDelete(null);
        }
    };

    const handleBulkImport = async (csvFile) => {
        try {
            const formData = new FormData();
            formData.append('csvFile', csvFile);
            
            const response = await axios.post('/api/products/bulk-import', formData, {
                ...config,
                headers: { 
                    ...config.headers, 
                    'Content-Type': 'multipart/form-data' 
                }
            });
            
            toast.success(`Successfully imported ${response.data.imported} products!`);
            setShowBulkImportModal(false);
            
            // Refetch products
            const { data } = await axios.get('/api/products/admin', config);
            setProducts(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to import products.');
        }
    };

    const filteredProducts = products
        .filter(p => p.status === activeTab || activeTab === 'All')
        .filter(p => p.name.toLowerCase().includes(filters.search.toLowerCase()))
        .filter(p => filters.category ? p.category && p.category._id === filters.category : true);

    return (
        <>
            <Meta title="Admin: Product Management" noIndex={true} />
            <div>
                <div className="product-page-header">
                    <h1>Product Management</h1>
                    <div className="filters-and-add">
                        <button className="auth-button secondary" onClick={() => setShowBulkImportModal(true)}>
                            <FiUpload /> Bulk Import
                        </button>
                        <button className="auth-button" onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>Add New Product</button>
                    </div>
                </div>
                <div className="filters">
                            <input type="text" placeholder="Search products..." className="admin-search-input" onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                            <select onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                <div className="tabs-container">
                    <button onClick={() => setActiveTab('Published')} className={`tab-btn ${activeTab === 'Published' ? 'active' : ''}`}>
                        Published <span className="product-tab-count">{productCounts.published}</span>
                    </button>
                    <button onClick={() => setActiveTab('Draft')} className={`tab-btn ${activeTab === 'Draft' ? 'active' : ''}`}>
                        Drafts <span className="product-tab-count">{productCounts.draft}</span>
                    </button>
                    <button onClick={() => setActiveTab('Hidden')} className={`tab-btn ${activeTab === 'Hidden' ? 'active' : ''}`}>
                        Hidden <span className="product-tab-count">{productCounts.hidden}</span>
                    </button>
                    <button onClick={() => setActiveTab('All')} className={`tab-btn ${activeTab === 'All' ? 'active' : ''}`}>
                        All Products <span className="product-tab-count">{productCounts.all}</span>
                    </button>
                </div>
                <div className="product-list">
                    {filteredProducts.map(product => (
                        <div key={product._id} className="product-list-item">
                            <img src={product.images[0]} alt={product.name} />
                            <div>
                                <strong>{product.name}</strong>
                                <p>{product.category ? product.category.name : 'Uncategorized'}</p>
                                {product.brand && <p className="product-meta">Brand: {product.brand}</p>}
                                {product.color && <p className="product-meta">Color: {product.color}</p>}
                            </div>
                            <div>{formatCurrency(product.price)}</div>
                            <div>{product.stock} in stock</div>
                            <div>{product.status}</div>
                            <div className="product-actions">
                                <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}><FiEdit /></button>
                                <button onClick={() => handleDeleteClick(product._id)}><FiTrash2 /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <ProductModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveProduct} 
                    product={editingProduct} 
                    isSaving={isSaving} 
                    showCloseButton={true}  // Add this prop to enable close button
                />
                <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmDeleteProduct} title="Delete Product" message="Are you sure you want to delete this product?" />
                <BulkImportModal 
                    isOpen={showBulkImportModal}
                    onClose={() => setShowBulkImportModal(false)}
                    onImport={handleBulkImport}
                />
            </div>
        </>
    );
};

export default AdminProductPage;
