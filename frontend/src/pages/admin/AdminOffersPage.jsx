import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import './AdminOffersPage.css';
import '../AllCategoriesPage.css'; // For shared status styles

// Product Selection Modal Component
const ProductSelectionModal = ({ isOpen, onClose, onProductSelect, products, categories, subCategories }) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedSubCategory) {
            const filtered = products.filter(p => p.subCategory && p.subCategory.includes(selectedSubCategory));
            setFilteredProducts(filtered);
        } else if (selectedCategory) {
            const filtered = products.filter(p => p.category && 
                (typeof p.category === 'object' ? p.category._id === selectedCategory : p.category === selectedCategory));
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [selectedCategory, selectedSubCategory, products]);

    // Filter products by search term
    const displayProducts = searchTerm 
        ? filteredProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : filteredProducts;

    const availableSubCategories = selectedCategory
        ? subCategories.filter(sc => sc.categories && sc.categories.some(c => 
            (typeof c === 'object' ? c._id === selectedCategory : c === selectedCategory)))
        : [];

    if (!isOpen) return null;

    return (
        <div className="product-modal-overlay">
            <div className="product-modal-content">
                <div className="product-modal-header">
                    <h2>Select Products</h2>
                    <button className="close-modal-btn" onClick={onClose}><FiX /></button>
                </div>
                
                <div className="product-modal-filters">
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="product-search-input"
                    />
                    <div className="filter-selects">
                        <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory(''); }}>
                            <option value="">All Categories</option>
                            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                        </select>
                        <select value={selectedSubCategory} onChange={(e) => setSelectedSubCategory(e.target.value)} disabled={!selectedCategory}>
                            <option value="">All Subcategories</option>
                            {availableSubCategories.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="product-modal-grid">
                    {displayProducts.length > 0 ? (
                        displayProducts.map(product => (
                            <div key={product._id} className="product-modal-item">
                                <img src={product.images[0]} alt={product.name} />
                                <div className="product-modal-details">
                                    <h4>{product.name}</h4>
                                    <div className="product-modal-price">
                                        <span>{formatCurrency(product.price)}</span>
                                        {product.discount > 0 && (
                                            <span className="discount">{product.discount}% off</span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => onProductSelect(product._id)} className="add-product-btn">
                                    <FiPlus /> Add
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="no-products-found">No products match your criteria</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdminOffersPage = () => {
    const [deals, setDeals] = useState([]);
    const [customOffers, setCustomOffers] = useState([{ title: '', products: [] }]);
    const [allProducts, setAllProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [currentSelectionTarget, setCurrentSelectionTarget] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [offerToDelete, setOfferToDelete] = useState(null);
    // Add saving states
    const [savingDeals, setSavingDeals] = useState(false);
    const [savingOffers, setSavingOffers] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // First get admin token from localStorage
                const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
                if (!adminInfo || !adminInfo.token) {
                    throw new Error("Admin authentication required");
                }
                
                const config = { headers: { Authorization: `Bearer ${adminInfo.token}` } };
                
                // Fetch products, categories and subcategories - these should be public endpoints
                const [prodRes, catRes, subCatRes] = await Promise.all([
                    axios.get('/api/products'),
                    axios.get('/api/categories'),
                    axios.get('/api/subcategories')
                ]);
                
                setAllProducts(prodRes.data);
                setAllCategories(catRes.data);
                setAllSubCategories(subCatRes.data);

                // Try to fetch offers - this might fail if the endpoint doesn't exist yet
                try {
                    const offersRes = await axios.get('/api/offers', config);
                    
                    const dealsOffer = offersRes.data.find(o => o.type === 'DEAL_OF_THE_DAY');
                    if (dealsOffer && dealsOffer.products) {
                        // First try to use the populated products from the API
                        if (dealsOffer.products[0] && typeof dealsOffer.products[0] === 'object') {
                            setDeals(dealsOffer.products);
                        } else {
                            // Fall back to mapping IDs if necessary
                            const dealProducts = dealsOffer.products.map(prodId => {
                                const fullProduct = prodRes.data.find(p => p._id === prodId);
                                return fullProduct || { 
                                    _id: prodId, 
                                    name: 'Unknown Product',
                                    price: 0,
                                    discount: 0,
                                    images: ['https://via.placeholder.com/150?text=No+Image']
                                };
                            });
                            setDeals(dealProducts);
                        }
                    }

                    const custom = offersRes.data.filter(o => o.type === 'CUSTOM_OFFER');
                    if (custom.length > 0) {
                        setCustomOffers(custom.map(c => {
                            // Check if products are already populated objects
                            if (c.products && c.products[0] && typeof c.products[0] === 'object') {
                                return { ...c };
                            } else {
                                // Map product IDs to actual product objects
                                const offerProducts = (c.products || []).map(prodId => {
                                    const fullProduct = prodRes.data.find(p => p._id === prodId);
                                    return fullProduct || { 
                                        _id: prodId, 
                                        name: 'Unknown Product',
                                        price: 0,
                                        discount: 0,
                                        images: ['https://via.placeholder.com/150?text=No+Image']
                                    };
                                });
                                return { ...c, products: offerProducts };
                            }
                        }));
                    }
                } catch (offerError) {
                    console.log("Offers endpoint may not be set up yet:", offerError);
                    // Continue without offers data - this is expected if the endpoint isn't set up yet
                }
            } catch (err) {
                console.error("Admin offers page error:", err);
                setError("Failed to fetch page data. Please ensure you're logged in as an admin.");
                toast.error("Failed to fetch page data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddProductToDeals = (productId) => {
        if (productId && !deals.find(p => p._id === productId)) {
            const product = allProducts.find(p => p._id === productId);
            setDeals([...deals, product]);
        }
    };

    const handleAddProductToCustom = (offerIndex, productId) => {
        if (productId) {
            const updatedOffers = [...customOffers];
            const product = allProducts.find(p => p._id === productId);
            if (product && !updatedOffers[offerIndex].products.find(p => p._id === productId)) {
                updatedOffers[offerIndex].products.push(product);
                setCustomOffers(updatedOffers);
            }
        }
    };

    const handleSaveDeals = async () => {
        try {
            setSavingDeals(true);
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
            if (!adminInfo || !adminInfo.token) {
                setSavingDeals(false);
                return toast.error('Admin authentication required');
            }
            
            const config = { headers: { Authorization: `Bearer ${adminInfo.token}` } };
            await axios.post('/api/offers', {
                title: 'Deals of the Day',
                type: 'DEAL_OF_THE_DAY',
                products: deals.map(p => p._id)
            }, config);
            toast.success("Deals of the Day saved!");
        } catch (error) {
            console.error("Save deals error:", error);
            toast.error("Failed to save deals. Make sure your backend supports the /api/offers endpoint.");
        } finally {
            setSavingDeals(false);
        }
    };

    const handleSaveCustomOffer = async (offerIndex) => {
        const offer = customOffers[offerIndex];
        if (!offer.title || offer.products.length === 0) {
            return toast.error("Offer title and products are required.");
        }
        try {
            // Set saving state for this specific offer
            setSavingOffers(prev => ({ ...prev, [offerIndex]: true }));
            
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
            if (!adminInfo || !adminInfo.token) {
                setSavingOffers(prev => ({ ...prev, [offerIndex]: false }));
                return toast.error('Admin authentication required');
            }
            
            const config = { 
                headers: { 
                    Authorization: `Bearer ${adminInfo.token}`,
                    'Content-Type': 'application/json'
                } 
            };
            
            // Log the request for debugging
            console.log("Sending offer save request:", {
                offerId: offer._id,
                title: offer.title,
                type: 'CUSTOM_OFFER',
                products: offer.products.map(p => p._id)
            });
            
            const response = await axios.post('/api/offers', {
                offerId: offer._id, // Pass ID for updates
                title: offer.title,
                type: 'CUSTOM_OFFER',
                products: offer.products.map(p => p._id)
            }, config);
            
            console.log("Offer save response:", response.data);
            toast.success(`Offer "${offer.title}" saved!`);
        } catch (error) {
            console.error("Save custom offer error:", error);
            
            // More detailed error information
            if (error.response) {
                // The request was made and the server responded with a status code
                console.log("Error response data:", error.response.data);
                console.log("Error response status:", error.response.status);
                console.log("Error response headers:", error.response.headers);
                
                const errorMessage = error.response.data?.message || `Error ${error.response.status}: Failed to save offer`;
                toast.error(errorMessage);
            } else if (error.request) {
                // The request was made but no response was received
                console.log("Error request:", error.request);
                toast.error("No response from server. Please check your network connection.");
            } else {
                // Something happened in setting up the request
                toast.error(`Request setup error: ${error.message}`);
            }
        } finally {
            setSavingOffers(prev => ({ ...prev, [offerIndex]: false }));
        }
    };

    const handleAddOffer = () => {
        setCustomOffers([...customOffers, { title: '', products: [] }]);
    };

    const handleOpenProductModal = (target) => {
        setCurrentSelectionTarget(target);
        setIsProductModalOpen(true);
    };

    const handleProductSelect = (productId) => {
        if (!productId) return;
        
        const product = allProducts.find(p => p._id === productId);
        if (!product) return;
        
        if (currentSelectionTarget === 'deals') {
            // Check if product already exists in deals
            if (!deals.find(p => p._id === productId)) {
                setDeals([...deals, product]);
                toast.success(`${product.name} added to Deals of the Day`);
            } else {
                toast.info('This product is already in Deals of the Day');
            }
        } else if (typeof currentSelectionTarget === 'number') {
            // Add to specific custom offer
            const updatedOffers = [...customOffers];
            if (!updatedOffers[currentSelectionTarget].products.find(p => p._id === productId)) {
                updatedOffers[currentSelectionTarget].products.push(product);
                setCustomOffers(updatedOffers);
                toast.success(`${product.name} added to ${updatedOffers[currentSelectionTarget].title || 'Custom Offer'}`);
            } else {
                toast.info('This product is already in this offer');
            }
        }
    };

    const handleOfferTitleChange = (index, title) => {
        const updatedOffers = [...customOffers];
        updatedOffers[index].title = title;
        setCustomOffers(updatedOffers);
    };

    const handleDeleteOffer = async (offerId) => {
        try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
            if (!adminInfo || !adminInfo.token) {
                return toast.error('Admin authentication required');
            }
            
            const config = { headers: { Authorization: `Bearer ${adminInfo.token}` } };
            await axios.delete(`/api/offers/${offerId}`, config);
            
            // Remove the deleted offer from state
            setCustomOffers(customOffers.filter(offer => offer._id !== offerId));
            setIsDeleteModalOpen(false);
            setOfferToDelete(null);
            
            toast.success("Offer deleted successfully!");
        } catch (error) {
            console.error("Delete offer error:", error);
            toast.error("Failed to delete offer.");
        }
    };

    const openDeleteModal = (offer) => {
        setOfferToDelete(offer);
        setIsDeleteModalOpen(true);
    };

    const renderSelectedProducts = (products, onRemove) => {
        if (!products || products.length === 0) {
            return <p className="no-products-msg">No products added to this offer yet.</p>;
        }
        return (
            <div className="offer-products-grid">
                {products.map((product, index) => (
                    <div key={product._id || index} className="offer-product-card">
                        <button onClick={() => onRemove(index)} className="remove-product-btn"><FiX /></button>
                        {/* Add null check for product.images */}
                        <img 
                            src={product.images && product.images.length > 0 
                                ? product.images[0] 
                                : 'https://via.placeholder.com/150?text=No+Image'} 
                            alt={product.name || 'Product'} 
                        />
                        <div className="offer-product-details">
                            <h4>{product.name || 'Unnamed Product'}</h4>
                            <div className="offer-product-price">
                                <span className="final-price">
                                    {formatCurrency(
                                        typeof product.price === 'number' && typeof product.discount === 'number'
                                            ? product.price - (product.price * (product.discount || 0) / 100)
                                            : 0
                                    )}
                                </span>
                                {product.discount > 0 && (
                                    <>
                                        <span className="original-price">{formatCurrency(product.price || 0)}</span>
                                        <span className="discount-tag">{product.discount || 0}% off</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="admin-offers-page">
            <h1>Manage Offers</h1>

            <div className="offer-section">
                <h2>Deals of the Day</h2>
                <button 
                    className="add-products-btn"
                    onClick={() => handleOpenProductModal('deals')}
                >
                    <FiPlus /> Add Products
                </button>
                {renderSelectedProducts(deals, (index) => setDeals(deals.filter((_, i) => i !== index)))}
                <button onClick={handleSaveDeals} className="save-btn" disabled={savingDeals}>
                    {savingDeals ? "Saving..." : "Save Deals of the Day"}
                </button>
            </div>

            <div className="offer-section">
                <h2>Custom Offers</h2>
                {customOffers.map((offer, index) => (
                    <div key={index} className="custom-offer-box">
                        <div className="custom-offer-header">
                            <input
                                type="text"
                                placeholder="Enter Offer Title (e.g., 'Best of Electronics')"
                                value={offer.title}
                                onChange={(e) => handleOfferTitleChange(index, e.target.value)}
                                className="offer-title-input"
                            />
                            {offer._id && (
                                <div className="offer-actions">
                                    <button 
                                        onClick={() => openDeleteModal(offer)} 
                                        className="delete-offer-btn"
                                        title="Delete offer"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            )}
                        </div>
                        <button 
                            className="add-products-btn"
                            onClick={() => handleOpenProductModal(index)}
                        >
                            <FiPlus /> Add Products
                        </button>
                        {renderSelectedProducts(offer.products, (prodIndex) => {
                            const updatedOffers = [...customOffers];
                            updatedOffers[index].products.splice(prodIndex, 1);
                            setCustomOffers(updatedOffers);
                        })}
                        <button 
                            onClick={() => handleSaveCustomOffer(index)} 
                            className="save-btn"
                            disabled={savingOffers[index]}
                        >
                            {savingOffers[index] ? "Saving..." : "Save Offer"}
                        </button>
                    </div>
                ))}
                <button onClick={handleAddOffer} className="add-more-btn">+ Add Another Offer Section</button>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="delete-modal">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete the offer "{offerToDelete?.title}"?</p>
                        <p>This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)} 
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDeleteOffer(offerToDelete?._id)} 
                                className="delete-btn"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ProductSelectionModal 
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onProductSelect={handleProductSelect}
                products={allProducts}
                categories={allCategories}
                subCategories={allSubCategories}
            />
        </div>
    );
};

export default AdminOffersPage;


