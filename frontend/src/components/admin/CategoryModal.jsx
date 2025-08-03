import React, { useState, useEffect } from 'react';
import '../AddressModal.css'; // Reusing styles

const CategoryModal = ({ isOpen, onClose, onSave, category }) => {
    const [name, setName] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [inputType, setInputType] = useState('file'); // 'file' or 'url'
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(category ? category.name : '');
            setPreview(category ? category.image : '');
            setImage(null);
            setImageUrl(category && category.image.startsWith('http') ? category.image : '');
            setInputType(category && category.image.startsWith('http') ? 'url' : 'file');
        }
    }, [isOpen, category]);

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
        formData.append('name', name);
        if (inputType === 'file' && image) {
            formData.append('image', image);
        } else if (inputType === 'url' && imageUrl) {
            formData.append('imageUrl', imageUrl);
        }
        onSave(formData, category?._id);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{category ? 'Edit Category' : 'Add New Category'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Category Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Image Source</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label><input type="radio" name="inputType" value="file" checked={inputType === 'file'} onChange={() => setInputType('file')} /> File Upload</label>
                            <label><input type="radio" name="inputType" value="url" checked={inputType === 'url'} onChange={() => setInputType('url')} /> Image URL</label>
                        </div>
                    </div>

                    {inputType === 'file' ? (
                        <div className="form-group">
                            <label>Category Image</label>
                            <input type="file" onChange={handleImageChange} accept="image/*" />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Image URL</label>
                            <input type="url" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setPreview(e.target.value); }} placeholder="https://example.com/image.jpg" />
                        </div>
                    )}
                    
                    {preview && <img src={preview} alt="Preview" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />}
                    <div className="modal-actions">
                        <button type="submit" className="auth-button">Save</button>
                        <button type="button" onClick={onClose} className="auth-button secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;
