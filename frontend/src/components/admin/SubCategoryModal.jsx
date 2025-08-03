import React, { useState, useEffect } from 'react';
import '../AddressModal.css'; // Reusing styles

const SubCategoryModal = ({ isOpen, onClose, onSave, subCategory, allCategories, isSaving }) => {
    const [name, setName] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [inputType, setInputType] = useState('file');
    const [imageUrl, setImageUrl] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setName(subCategory ? subCategory.name : '');
            setPreview(subCategory ? subCategory.image : '');
            setImage(null);
            setImageUrl(subCategory && subCategory.image.startsWith('http') ? subCategory.image : '');
            setInputType(subCategory && subCategory.image.startsWith('http') ? 'url' : 'file');
            setSelectedCategories(subCategory ? subCategory.categories.map(c => c._id) : []);
        }
    }, [isOpen, subCategory]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedCategories.length === 0) {
            toast.error('Please select at least one parent category.');
            return;
        }
        const formData = new FormData();
        formData.append('name', name);
        formData.append('categories', JSON.stringify(selectedCategories));

        if (inputType === 'file' && image) {
            formData.append('image', image);
        } else if (inputType === 'url' && imageUrl) {
            formData.append('imageUrl', imageUrl);
        } else if (!subCategory?._id && !image) {
            toast.error('Please provide an image for the new sub-category.');
            return;
        }
        onSave(formData, subCategory?._id);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{subCategory ? 'Edit Sub-Category' : 'Add New Sub-Category'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Sub-Category Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Parent Categories</label>
                        <div className="category-checkbox-group">
                            {allCategories.map(cat => (
                                <label key={cat._id} className="category-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat._id)}
                                        onChange={() => handleCategoryChange(cat._id)}
                                    />
                                    {cat.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Image Source</label>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <label><input type="radio" name="inputType" value="file" checked={inputType === 'file'} onChange={() => setInputType('file')} /> File Upload</label>
                            <label><input type="radio" name="inputType" value="url" checked={inputType === 'url'} onChange={() => setInputType('url')} /> Image URL</label>
                        </div>
                    </div>

                    {inputType === 'file' ? (
                        <div className="form-group">
                            <label>Sub-Category Image (1:1 ratio recommended)</label>
                            <input type="file" onChange={handleImageChange} accept="image/*" />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Image URL</label>
                            <input type="url" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setPreview(e.target.value); }} placeholder="https://example.com/image.jpg" />
                        </div>
                    )}
                    
                    {preview && <img src={preview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }} />}
                    
                    <div className="modal-actions">
                        <button type="submit" className="auth-button" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                        <button type="button" onClick={onClose} className="auth-button secondary" disabled={isSaving}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubCategoryModal;
