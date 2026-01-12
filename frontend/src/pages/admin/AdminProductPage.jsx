import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
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
    
    // Bulk selection states
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
    const [bulkAction, setBulkAction] = useState('');
    const [bulkStatusValue, setBulkStatusValue] = useState('Published');
    const [bulkStockValue, setBulkStockValue] = useState(0);
    
    // Infinite scroll states
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const PRODUCTS_PER_PAGE = 20;
    const observerTarget = useRef(null);

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
            outOfStock: products.filter(p => p.stock === 0).length,
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

    const filteredProducts = useMemo(() => {
        let filtered = products;
        
        // Filter by tab
        if (activeTab === 'Out of Stock') {
            filtered = filtered.filter(p => p.stock === 0);
        } else if (activeTab !== 'All') {
            filtered = filtered.filter(p => p.status === activeTab);
        }
        
        // Filter by search
        if (filters.search) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(filters.search.toLowerCase())
            );
        }
        
        // Filter by category
        if (filters.category) {
            filtered = filtered.filter(p => 
                p.category && p.category._id === filters.category
            );
        }
        
        return filtered;
    }, [products, activeTab, filters]);

    // Load products in chunks
    useEffect(() => {
        const startIndex = 0;
        const endIndex = page * PRODUCTS_PER_PAGE;
        const productsToDisplay = filteredProducts.slice(startIndex, endIndex);
        
        setDisplayedProducts(productsToDisplay);
        setHasMore(endIndex < filteredProducts.length);
    }, [filteredProducts, page]);

    // Reset pagination when filters/tab change
    useEffect(() => {
        setPage(1);
    }, [activeTab, filters]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage(prevPage => prevPage + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore]);

    const handleStatusChange = async (productId, newStatus) => {
        try {
            await axios.patch(`/api/products/${productId}/status`, 
                { status: newStatus }, 
                config
            );
            
            // Update local state
            setProducts(products.map(p => 
                p._id === productId ? { ...p, status: newStatus } : p
            ));
            
            toast.success('Product status updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status.');
        }
    };

    // Reset selection when filters change
    useEffect(() => {
        setSelectedProducts([]);
    }, [activeTab, filters]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(displayedProducts.map(p => p._id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (productId) => {
        setSelectedProducts(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleBulkActionClick = (action) => {
        setBulkAction(action);
        if (action === 'delete') {
            setShowConfirmModal(true);
        } else {
            setShowBulkActionsModal(true);
        }
    };

    const handleBulkUpdate = async () => {
        try {
            const updates = {};
            
            if (bulkAction === 'status') {
                updates.status = bulkStatusValue;
            } else if (bulkAction === 'stock') {
                updates.stock = parseInt(bulkStockValue);
            }

            await axios.patch('/api/products/bulk-update', {
                productIds: selectedProducts,
                updates
            }, config);

            toast.success(`Successfully updated ${selectedProducts.length} products!`);
            
            // Refetch products
            const { data } = await axios.get('/api/products/admin', config);
            setProducts(data);
            setSelectedProducts([]);
            setShowBulkActionsModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update products.');
        }
    };

    const handleBulkDelete = async () => {
        try {
            await axios.post('/api/products/bulk-delete', {
                productIds: selectedProducts
            }, config);

            toast.success(`Successfully deleted ${selectedProducts.length} products!`);
            
            setProducts(products.filter(p => !selectedProducts.includes(p._id)));
            setSelectedProducts([]);
            setShowConfirmModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete products.');
        }
    };

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

                {/* Bulk Actions Toolbar */}
                {selectedProducts.length > 0 && (
                    <div className="bulk-actions-toolbar">
                        <div className="bulk-selected-info">
                            <input 
                                type="checkbox" 
                                checked={selectedProducts.length === displayedProducts.length}
                                onChange={handleSelectAll}
                            />
                            <span>{selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected</span>
                        </div>
                        <div className="bulk-action-buttons">
                            <button 
                                className="bulk-action-btn status-btn"
                                onClick={() => handleBulkActionClick('status')}
                            >
                                Update Status
                            </button>
                            <button 
                                className="bulk-action-btn stock-btn"
                                onClick={() => handleBulkActionClick('stock')}
                            >
                                Update Stock
                            </button>
                            <button 
                                className="bulk-action-btn delete-btn"
                                onClick={() => handleBulkActionClick('delete')}
                            >
                                <FiTrash2 /> Delete Selected
                            </button>
                        </div>
                    </div>
                )}

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
                    <button onClick={() => setActiveTab('Out of Stock')} className={`tab-btn ${activeTab === 'Out of Stock' ? 'active' : ''}`}>
                        Out of Stock <span className="product-tab-count">{productCounts.outOfStock}</span>
                    </button>
                    <button onClick={() => setActiveTab('All')} className={`tab-btn ${activeTab === 'All' ? 'active' : ''}`}>
                        All Products <span className="product-tab-count">{productCounts.all}</span>
                    </button>
                </div>
                <div className="product-list">
                    {displayedProducts.map(product => (
                        <div key={product._id} className="product-list-item">
                            <div className="product-checkbox">
                                <input 
                                    type="checkbox"
                                    checked={selectedProducts.includes(product._id)}
                                    onChange={() => handleSelectProduct(product._id)}
                                />
                            </div>
                            <img src={product.images[0]} alt={product.name} />
                            <div>
                                <strong>{product.name}</strong>
                                <p>{product.category ? product.category.name : 'Uncategorized'}</p>
                                {product.brand && <p className="product-meta">Brand: {product.brand}</p>}
                                {product.color && <p className="product-meta">Color: {product.color}</p>}
                            </div>
                            <div>{formatCurrency(product.price)}</div>
                            <div className={product.stock === 0 ? 'out-of-stock-text' : ''}>
                                {product.stock} in stock
                            </div>
                            <div>
                                <select 
                                    value={product.status} 
                                    onChange={(e) => handleStatusChange(product._id, e.target.value)}
                                    className="status-dropdown"
                                >
                                    <option value="Published">Published</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Hidden">Hidden</option>
                                </select>
                            </div>
                            <div className="product-actions">
                                <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}><FiEdit /></button>
                                <button onClick={() => handleDeleteClick(product._id)}><FiTrash2 /></button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Intersection observer target */}
                    {hasMore && (
                        <div ref={observerTarget} className="loading-trigger">
                            <p>Loading more products...</p>
                        </div>
                    )}
                    
                    {displayedProducts.length === 0 && (
                        <div className="no-products">
                            <p>No products found.</p>
                        </div>
                    )}
                </div>
                
                {/* Bulk Actions Modal */}
                {showBulkActionsModal && (
                    <div className="modal-overlay">
                        <div className="modal-content bulk-action-modal">
                            <button className="modal-close-btn" onClick={() => setShowBulkActionsModal(false)}>
                                <FiX />
                            </button>
                            
                            <h2>
                                {bulkAction === 'status' ? 'Update Status' : 'Update Stock'}
                            </h2>
                            
                            <p className="bulk-modal-info">
                                Updating {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}
                            </p>

                            {bulkAction === 'status' ? (
                                <div className="form-group">
                                    <label>New Status</label>
                                    <select 
                                        value={bulkStatusValue}
                                        onChange={(e) => setBulkStatusValue(e.target.value)}
                                        className="status-dropdown"
                                    >
                                        <option value="Published">Published</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Hidden">Hidden</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>New Stock Quantity</label>
                                    <input 
                                        type="number"
                                        value={bulkStockValue}
                                        onChange={(e) => setBulkStockValue(e.target.value)}
                                        min="0"
                                        className="stock-input"
                                    />
                                </div>
                            )}

                            <div className="modal-actions">
                                <button 
                                    className="auth-button secondary"
                                    onClick={() => setShowBulkActionsModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="auth-button"
                                    onClick={handleBulkUpdate}
                                >
                                    Update Products
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ProductModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveProduct} 
                    product={editingProduct} 
                    isSaving={isSaving} 
                    showCloseButton={true}
                />
                <ConfirmationModal 
                    isOpen={showConfirmModal} 
                    onClose={() => setShowConfirmModal(false)} 
                    onConfirm={bulkAction === 'delete' && selectedProducts.length > 0 ? handleBulkDelete : confirmDeleteProduct}
                    title={selectedProducts.length > 0 ? "Delete Multiple Products" : "Delete Product"}
                    message={selectedProducts.length > 0 
                        ? `Are you sure you want to delete ${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''}?` 
                        : "Are you sure you want to delete this product?"
                    }
                />
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
