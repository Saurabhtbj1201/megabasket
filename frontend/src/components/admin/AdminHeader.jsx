import React from 'react';
import { FiMenu, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AdminHeader = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));

    const logoutHandler = () => {
        localStorage.removeItem('adminInfo');
        navigate('/admin/login');
    };

    return (
        <header className="admin-header">
            <div className="admin-header-left">
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    <FiMenu />
                </button>
                <h2>Admin Panel</h2>
            </div>
            <div className="admin-profile">
                {adminInfo && (
                    <>
                        <FiUser />
                        <span className="admin-profile-name">{adminInfo.name}</span>
                        <button onClick={logoutHandler} className="btn-danger">Logout</button>
                    </>
                )}
            </div>
        </header>
    );
};

export default AdminHeader;
