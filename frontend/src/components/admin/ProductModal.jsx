import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiX, FiPlus } from 'react-icons/fi';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import '../AddressModal.css'; // Reusing styles
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', category: '', price: 0, discount: 0, stock: 0,
        tags: '', shippingInfo: '', status: 'Published', brand: '', color: ''
    });
    const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
    const [defaultPhoto, setDefaultPhoto] = useState(null);
    const [additionalPhotos, setAdditionalPhotos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [availableSubCategories, setAvailableSubCategories] = useState([]);
    const [selectedSubCategories, setSelectedSubCategories] = useState([]);
    const [finalPrice, setFinalPrice] = useState(0);
    const [defaultPhotoPreview, setDefaultPhotoPreview] = useState('');
    const [additionalPhotoPreviews, setAdditionalPhotoPreviews] = useState([]);
    
    // Cropper state
    const [upImg, setUpImg] = useState();
    const [crop, setCrop] = useState();
    const [croppingFor, setCroppingFor] = useState(null); // 'default' or 'additional'
    const imgRef = useRef(null);
    const additionalPhotosInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoriesRes, subCategoriesRes] = await Promise.all([
                    axios.get('/api/categories'),
                    axios.get('/api/subcategories')
                ]);
                setCategories(categoriesRes.data);
                setAllSubCategories(subCategoriesRes.data);
            } catch (error) {
                console.error("Failed to fetch categories or sub-categories", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name, description: product.description, category: product.category._id,
                price: product.price, discount: product.discount, stock: product.stock,
                tags: product.tags.join(', '), shippingInfo: product.shippingInfo, status: product.status,
                brand: product.brand || '',
                color: product.color || ''
            });
            setSpecifications(product.specifications.length > 0 ? product.specifications : [{ key: '', value: '' }]);
            setSelectedSubCategories(product.subCategory || []);
            setDefaultPhotoPreview(product.images[0] || '');
            setAdditionalPhotoPreviews(product.images.slice(1));
        } else {
            setFormData({ name: '', description: '', category: '', price: 0, discount: 0, stock: 0, tags: '', shippingInfo: '', status: 'Published', brand: '', color: '' });
            setSpecifications([{ key: '', value: '' }]);
            setSelectedSubCategories([]);
            setDefaultPhotoPreview('');
            setAdditionalPhotoPreviews([]);
        }
        setAdditionalPhotos([]); // Always reset new photos
        setDefaultPhoto(null);
        setUpImg(null);
        setCroppingFor(null);
    }, [product, isOpen]);

    useEffect(() => {
        if (formData.category && allSubCategories.length > 0) {
            const filtered = allSubCategories.filter(sub =>
                sub.categories.some(cat => cat._id === formData.category)
            );
            setAvailableSubCategories(filtered);

            // Deselect sub-categories that are not in the new available list
            const availableIds = filtered.map(f => f._id);
            setSelectedSubCategories(prev => prev.filter(id => availableIds.includes(id)));
        } else {
            setAvailableSubCategories([]);
            setSelectedSubCategories([]);
        }
    }, [formData.category, allSubCategories]);

    useEffect(() => {
        const price = parseFloat(formData.price) || 0;
        const discount = parseFloat(formData.discount) || 0;
        setFinalPrice(price - (price * discount / 100));
    }, [formData.price, formData.discount]);

    if (!isOpen) return null;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSpecChange = (index, e) => {
        const newSpecs = [...specifications];
        newSpecs[index][e.target.name] = e.target.value;
        setSpecifications(newSpecs);
    };
    const addSpec = () => setSpecifications([...specifications, { key: '', value: '' }]);
    const removeSpec = (index) => setSpecifications(specifications.filter((_, i) => i !== index));

    const handleSubCategoryChange = (subCategoryId) => {
        setSelectedSubCategories(prev =>
            prev.includes(subCategoryId)
                ? prev.filter(id => id !== subCategoryId)
                : [...prev, subCategoryId]
        );
    };

    const onSelectFile = (e, type) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            setCroppingFor(type);
            const reader = new FileReader();
            reader.addEventListener('load', () => setUpImg(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
        e.target.value = null;
    };

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
                const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
                if (croppingFor === 'default') {
                    setDefaultPhoto(croppedFile);
                    setDefaultPhotoPreview(URL.createObjectURL(blob));
                } else {
                    setAdditionalPhotos(prev => [...prev, croppedFile]);
                    setAdditionalPhotoPreviews(prev => [...prev, URL.createObjectURL(blob)]);
                }
            }
            setUpImg(null);
            setCroppingFor(null);
        }, 'image/jpeg', 1);
    };

    const removeAdditionalPhoto = (index, isExisting) => {
        if (isExisting) {
            // This would require backend logic to remove a specific image URL.
            // For now, we'll just remove from preview. A more robust solution would track removed URLs.
            setAdditionalPhotoPreviews(prev => prev.filter((_, i) => i !== index));
        } else {
            // Find the correct index in the new photos array
            const newIndex = index - (product?.images?.length - 1 || 0);
            setAdditionalPhotos(prev => prev.filter((_, i) => i !== newIndex));
            setAdditionalPhotoPreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append('specifications', JSON.stringify(specifications.filter(s => s.key && s.value)));
        data.append('subCategory', JSON.stringify(selectedSubCategories));
        if (defaultPhoto) data.append('defaultPhoto', defaultPhoto);
        additionalPhotos.forEach(photo => data.append('additionalPhotos', photo));
        onSave(data, product?._id);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit}>
                    {/* Form fields */}
                    <div className="form-group"><label>Product Title</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="4"></textarea></div>
                    <div className="form-group"><label>Category</label><select name="category" value={formData.category} onChange={handleChange} required><option value="">Select Category</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                    
                    {availableSubCategories.length > 0 && (
                        <div className="form-group">
                            <label>Sub-Categories</label>
                            <div className="category-checkbox-group">
                                {availableSubCategories.map(sub => (
                                    <label key={sub._id} className="category-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubCategories.includes(sub._id)}
                                            onChange={() => handleSubCategoryChange(sub._id)}
                                        />
                                        {sub.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="specifications-container">
                        <h4>Specifications</h4>
                        {specifications.map((spec, index) => (
                            <div key={index} className="spec-row">
                                <input type="text" name="key" placeholder="Key (e.g., Color)" value={spec.key} onChange={(e) => handleSpecChange(index, e)} />
                                <input type="text" name="value" placeholder="Value (e.g., Red)" value={spec.value} onChange={(e) => handleSpecChange(index, e)} />
                                <button type="button" onClick={() => removeSpec(index)}>Remove</button>
                            </div>
                        ))}
                        <button type="button" onClick={addSpec} className="add-spec-btn">Add Specification</button>
                    </div>

                    <div className="form-grid">
                        <div className="form-group"><label>MRP</label><input type="number" name="price" value={formData.price} onChange={handleChange} /></div>
                        <div className="form-group"><label>Discount (%)</label><input type="number" name="discount" value={formData.discount} onChange={handleChange} /></div>
                        <div className="form-group"><label>Final Price</label><input type="text" value={finalPrice.toFixed(2)} readOnly /></div>
                        <div className="form-group"><label>Stock</label><input type="number" name="stock" value={formData.stock} onChange={handleChange} /></div>
                        <div className="form-group"><label>Brand</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} /></div>
                        <div className="form-group"><label>Color</label><input type="text" name="color" value={formData.color} onChange={handleChange} /></div>
                    </div>

                    <div className="form-group">
                        <label>Default Photo</label>
                        <input type="file" onChange={(e) => onSelectFile(e, 'default')} accept="image/*" />
                        {defaultPhotoPreview && <img src={defaultPhotoPreview} alt="Default Preview" className="default-photo-preview" />}
                    </div>
                    
                    <div className="form-group">
                        <label>Additional Photos</label>
                        <div className="photo-previews-container">
                            {additionalPhotoPreviews.map((photoUrl, index) => {
                                const isExisting = typeof photoUrl === 'string';
                                return (
                                    <div key={index} className="photo-preview-item">
                                        <img src={photoUrl} alt={`preview ${index}`} />
                                        <button type="button" className="remove-photo-btn" onClick={() => removeAdditionalPhoto(index, isExisting)}><FiX size={16} /></button>
                                    </div>
                                );
                            })}
                        </div>
                        <input 
                            type="file" 
                            multiple 
                            ref={additionalPhotosInputRef} 
                            onChange={(e) => onSelectFile(e, 'additional')} 
                            style={{ display: 'none' }} 
                            accept="image/*"
                        />
                        <button type="button" className="add-spec-btn" onClick={() => additionalPhotosInputRef.current.click()}>
                            <FiPlus /> Add More Photos
                        </button>
                    </div>
                    
                    <div className="form-group"><label>Tags (comma-separated)</label><input type="text" name="tags" value={formData.tags} onChange={handleChange} /></div>
                    <div className="form-group"><label>Shipping Info</label><input type="text" name="shippingInfo" value={formData.shippingInfo} onChange={handleChange} /></div>
                    <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option value="Published">Published</option><option value="Draft">Draft</option><option value="Hidden">Hidden</option></select></div>

                    <div className="modal-actions">
                        <button type="submit" className="auth-button">Save Product</button>
                        <button type="button" onClick={onClose} className="auth-button secondary">Cancel</button>
                    </div>
                </form>
            </div>
            {upImg && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={1}>
                            <img src={upImg} onLoad={onImageLoad} alt="Crop me" />
                        </ReactCrop>
                        <button onClick={getCroppedImg} className="auth-button" style={{ marginTop: '1rem' }}>Crop</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductModal;
