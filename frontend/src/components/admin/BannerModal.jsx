import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../AddressModal.css'; // Reusing styles

const BannerModal = ({ isOpen, onClose, onSave, banner }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('/api/categories');
                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories');
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTitle(banner ? banner.title : '');
            setDescription(banner ? banner.description : '');
            setPreview(banner ? banner.image : '');
            setSelectedCategory(banner?.category?._id || '');
            setSelectedProduct(banner?.product?._id || '');
            setImage(null);
        }
    }, [isOpen, banner]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (selectedCategory) {
                try {
                    const { data } = await axios.get(`/api/products/category/${selectedCategory}`);
                    setProducts(data);
                } catch (error) {
                    console.error('Failed to fetch products');
                    setProducts([]);
                }
            } else {
                setProducts([]);
            }
        };
        fetchProducts();
    }, [selectedCategory]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (selectedCategory) formData.append('category', selectedCategory);
        if (selectedProduct) formData.append('product', selectedProduct);
        if (image) {
            formData.append('image', image);
        }
        onSave(formData, banner?._id);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{banner ? 'Edit Banner' : 'Add New Banner'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Banner Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3"></textarea>
                    </div>
                    <div className="form-group">
                        <label>Banner Image (Max 5MB)</label>
                        <input type="file" onChange={handleImageChange} accept="image/*" />
                    </div>
                    {preview && <img src={preview} alt="Preview" style={{ width: '200px', height: '100px', objectFit: 'cover', marginBottom: '1rem' }} />}
                    <div className="form-group">
                        <label>Link to Category (Optional)</label>
                        <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedProduct(''); }}>
                            <option value="">Select a category</option>
                            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Link to Product (Optional)</label>
                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} disabled={!selectedCategory}>
                            <option value="">Select a product</option>
                            {products.map(prod => <option key={prod._id} value={prod._id}>{prod.name}</option>)}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="auth-button">Save Banner</button>
                        <button type="button" onClick={onClose} className="auth-button secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BannerModal;
