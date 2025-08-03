import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import AdminUserModal from '../../components/admin/AdminUserModal';
import AdminPasswordModal from '../../components/admin/AdminPasswordModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import Meta from '../../components/Meta';
import './AdminProfilePage.css';

const AdminProfilePage = () => {
    const [adminInfo, setAdminInfo] = useState(null);
    const [allAdmins, setAllAdmins] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);

    const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
        try {
            const [profileRes, adminsRes] = await Promise.all([
                axios.get('/api/users/profile', config),
                axios.get('/api/users/admins', config)
            ]);
            setAdminInfo(profileRes.data);
            setAllAdmins(adminsRes.data);
        } catch (error) {
            toast.error('Failed to fetch admin data.');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateProfile = async (formData) => {
        try {
            const { data } = await axios.put('/api/users/profile', formData, { ...config, headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } });
            toast.success('Profile updated successfully!');
            setIsEditModalOpen(false);
            fetchData(); // Refresh data
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed.');
        }
    };

    const handleAddAdmin = async (formData) => {
        try {
            await axios.post('/api/users/admins', formData, { ...config, headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } });
            toast.success('New admin added successfully!');
            setIsAddModalOpen(false);
            fetchData(); // Refresh data
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add admin.');
        }
    };

    const handleChangePassword = async ({ oldPassword, newPassword, confirmPassword }) => {
        if (newPassword !== confirmPassword) {
            return toast.error("New passwords do not match.");
        }
        try {
            await axios.put('/api/users/profile/password', { oldPassword, newPassword }, config);
            toast.success('Password updated successfully!');
            setIsPasswordModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password update failed.');
        }
    };

    const handleUpdateOtherAdmin = async (formData, adminId) => {
        try {
            await axios.put(`/api/users/admins/${adminId}`, formData, { ...config, headers: { ...config.headers, 'Content-Type': 'multipart/form-data' } });
            toast.success('Admin updated successfully!');
            setEditingAdmin(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed.');
        }
    };

    const handleDeleteClick = (adminId) => {
        setAdminToDelete(adminId);
        setShowConfirmModal(true);
    };

    const confirmDeleteAdmin = async () => {
        try {
            await axios.delete(`/api/users/admins/${adminToDelete}`, config);
            toast.success('Admin deleted successfully!');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed.');
        } finally {
            setShowConfirmModal(false);
            setAdminToDelete(null);
        }
    };

    if (!adminInfo) return <p>Loading...</p>;

    return (
        <>
            <Meta title="Admin: Profile Management" noIndex={true} />
            <div className="admin-profile-page">
                <div className="current-admin-card">
                    <img src={adminInfo.profilePicture || 'https://via.placeholder.com/100'} alt={adminInfo.name} />
                    <div className="current-admin-info">
                        <h2>{adminInfo.name}</h2>
                        <p>{adminInfo.email}</p>
                        <p>{adminInfo.phone || 'No mobile number provided'}</p>
                        <div className="current-admin-actions">
                            <button className="auth-button" onClick={() => setIsEditModalOpen(true)}>Update Profile</button>
                            <button className="auth-button btn-danger" onClick={() => setIsPasswordModalOpen(true)}>Update Password</button>
                        </div>
                    </div>
                </div>

                <div className="all-admins-section">
                    <div className="all-admins-header">
                        <h2>All Administrators</h2>
                        <button className="auth-button" onClick={() => setIsAddModalOpen(true)}>Add New Admin</button>
                    </div>
                    <div className="admin-list">
                        {allAdmins.map(admin => (
                            <div key={admin._id} className="admin-list-item">
                                <img src={admin.profilePicture || 'https://via.placeholder.com/50'} alt={admin.name} />
                                <div className="admin-info">
                                    <strong>{admin.name}</strong>
                                    <p>{admin.email}</p>
                                </div>
                                <div className="admin-joined-date">
                                    Joined: {new Date(admin.createdAt).toLocaleDateString()}
                                </div>
                                <div className="admin-actions">
                                    <button onClick={() => setEditingAdmin(admin)}><FiEdit /></button>
                                    <button onClick={() => handleDeleteClick(admin._id)}><FiTrash2 /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <AdminUserModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdateProfile}
                    mode="edit"
                    userData={adminInfo}
                />
                <AdminPasswordModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                    onSave={handleChangePassword}
                />
                <AdminUserModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleAddAdmin}
                    mode="add"
                />
                <AdminUserModal
                    isOpen={!!editingAdmin}
                    onClose={() => setEditingAdmin(null)}
                    onSave={handleUpdateOtherAdmin}
                    mode="editOther"
                    userData={editingAdmin}
                />
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmDeleteAdmin}
                    title="Delete Admin"
                    message="Are you sure you want to delete this admin? This action cannot be undone."
                />
            </div>
        </>
    );
};

export default AdminProfilePage;
