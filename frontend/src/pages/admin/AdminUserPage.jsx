import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import UserOrdersModal from '../../components/admin/UserOrdersModal';
import Meta from '../../components/Meta';
import './AdminUserPage.css';

const AdminUserPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await axios.get('/api/users', config);
                setUsers(data);
            } catch (error) {
                toast.error('Failed to fetch users.');
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDetailsClick = async (userId) => {
        try {
            const { data } = await axios.get(`/api/users/${userId}`, config);
            setSelectedUser(data);
            setIsDetailsModalOpen(true);
        } catch (error) {
            toast.error('Failed to fetch user details.');
        }
    };

    const handleOrdersClick = async (userId) => {
        try {
            const { data } = await axios.get(`/api/orders/user/${userId}`, config);
            setUserOrders(data);
            setIsOrdersModalOpen(true);
        } catch (error) {
            toast.error('Failed to fetch user orders.');
        }
    };

    return (
        <>
            <Meta title="Admin: User Management" noIndex={true} />
            <div>
                <div className="user-page-header">
                    <h1>User Management</h1>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="admin-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="user-list">
                    {filteredUsers.map(user => (
                        <div key={user._id} className="user-list-item">
                            <img src={user.profilePicture || 'https://via.placeholder.com/60'} alt={user.name} />
                            <div className="user-info">
                                <strong>{user.name}</strong>
                                <p>{user.email}</p>
                                <p>{user.phone || 'No phone number'}</p>
                            </div>
                            <div className="user-actions">
                                <button className="auth-button" onClick={() => handleDetailsClick(user._id)}>Details</button>
                                <button className="auth-button secondary" onClick={() => handleOrdersClick(user._id)}>Orders</button>
                            </div>
                        </div>
                    ))}
                </div>

                <UserDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    user={selectedUser}
                />
                <UserOrdersModal
                    isOpen={isOrdersModalOpen}
                    onClose={() => setIsOrdersModalOpen(false)}
                    orders={userOrders}
                />
            </div>
        </>
    );
};

export default AdminUserPage;
