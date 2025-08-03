import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import '../styles/AdminLayout.css';

const AdminLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);
    const location = useLocation();

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sidebarRef]);

    useEffect(() => {
        // Close sidebar on route change
        setSidebarOpen(false);
    }, [location]);

    return (
        <div className="admin-layout">
            <AdminSidebar isOpen={isSidebarOpen} sidebarRef={sidebarRef} />
            <div className="admin-main-content">
                <AdminHeader toggleSidebar={toggleSidebar} />
                <main className="admin-page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
