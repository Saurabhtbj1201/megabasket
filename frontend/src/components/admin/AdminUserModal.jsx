import React, { useState, useEffect, useRef } from 'react';
import PasswordField from '../PasswordField';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import '../AddressModal.css'; // Reusing some styles

const AdminUserModal = ({ isOpen, onClose, onSave, mode, userData }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [upImg, setUpImg] = useState();
    const [crop, setCrop] = useState();
    const [croppedImageFile, setCroppedImageFile] = useState(null);
    const imgRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (mode.startsWith('edit') && userData) {
                setFormData({ name: userData.name, email: userData.email, phone: userData.phone || '' });
            } else {
                setFormData({ name: '', email: '', phone: '' });
            }
            setPassword('');
            setConfirmPassword('');
            setCroppedImageFile(null);
            setUpImg(null);
        }
    }, [isOpen, mode, userData]);

    if (!isOpen) return null;

    function onSelectFile(e) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () => setUpImg(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
    }

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
            if (blob) setCroppedImageFile(new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
            setUpImg(null);
        }, 'image/jpeg', 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        if (croppedImageFile) {
            data.append('profilePicture', croppedImageFile);
        }
        if (mode === 'add') {
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            data.append('password', password);
        }
        onSave(data, userData?._id);
    };

    return (
        <>
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
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2>{mode.startsWith('edit') ? 'Update Profile' : 'Add New Admin'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group"><label>Profile Picture</label><input type="file" onChange={onSelectFile} accept="image/*" /></div>
                        <div className="form-group"><label>Full Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                        <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
                        <div className="form-group"><label>Mobile (Optional)</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                        {mode === 'add' && (
                            <>
                                <div className="form-group"><label>Password</label><PasswordField value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                                <div className="form-group"><label>Confirm Password</label><PasswordField value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                            </>
                        )}
                        <div className="modal-actions">
                            <button type="submit" className="auth-button">Save</button>
                            <button type="button" onClick={onClose} className="auth-button secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AdminUserModal;
