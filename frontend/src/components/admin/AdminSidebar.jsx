import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

const AdminSidebar = ({ isOpen, sidebarRef }) => {
    const [counts, setCounts] = useState(null);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get('/api/admin/counts', config);
                setCounts(data);
            } catch (error) {
                console.error("Failed to fetch admin counts");
            }
        };
        fetchCounts();
    }, []);

    return (
        <aside ref={sidebarRef} className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
            <nav>
                <ul>
                    <li><NavLink to="/admin/dashboard">Dashboard</NavLink></li>
                    <li><NavLink to="/admin/products">Products <span className="sidebar-count-badge">{counts?.products}</span></NavLink></li>
                    <li><NavLink to="/admin/categories">Categories <span className="sidebar-count-badge">{counts?.categories}</span></NavLink></li>
                    <li><NavLink to="/admin/subcategories">Sub Categories <span className="sidebar-count-badge">{counts?.subCategories}</span></NavLink></li>
                    <li><NavLink to="/admin/orders">Orders <span className="sidebar-count-badge">{counts?.orders}</span></NavLink></li>
                    <li><NavLink to="/admin/users">Users <span className="sidebar-count-badge">{counts?.users}</span></NavLink></li>
                    <li><NavLink to="/admin/banners">Banners <span className="sidebar-count-badge">{counts?.banners}</span></NavLink></li>
                    <li><NavLink to="/admin/profile">Admin Profile</NavLink></li>
                    <li><NavLink to="/admin/contact">Contact Messages <span className="sidebar-count-badge">{counts?.contactMessages}</span></NavLink></li>
                </ul>
            </nav>
        </aside>
    );
};

export default AdminSidebar;
