import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
    return adminInfo && adminInfo.role === 'Admin' ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminRoute;
