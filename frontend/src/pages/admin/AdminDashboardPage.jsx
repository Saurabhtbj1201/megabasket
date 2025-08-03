import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiUsers, FiBox, FiDollarSign } from 'react-icons/fi';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler } from 'chart.js';
import { formatCurrency } from '../../utils/formatCurrency';
import Meta from '../../components/Meta';
import './AdminDashboardPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const token = JSON.parse(localStorage.getItem('adminInfo'))?.token;
                const config = { 
                    headers: { Authorization: `Bearer ${token}` },
                    params: dateRange
                };
                const { data } = await axios.get('/api/admin/stats', config);
                setStats(data);
            } catch (error) {
                toast.error('Failed to fetch dashboard stats.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [dateRange]);

    if (loading) return <p>Loading dashboard...</p>;
    if (!stats) return <p>Could not load dashboard data.</p>;

    const orderStatusData = {
        labels: stats.charts.orderStatusBreakdown.map(s => s._id),
        datasets: [{
            label: 'Orders',
            data: stats.charts.orderStatusBreakdown.map(s => s.count),
            backgroundColor: ['#f55bf2ff', '#ffc107', '#007bff', '#17a2b8', '#28a745', '#dc3545', '#343a40'],
        }],
    };

    const salesPerformanceData = {
        labels: stats.charts.salesPerformance.map(s => s._id),
        datasets: [{
            label: 'Revenue',
            data: stats.charts.salesPerformance.map(s => s.totalRevenue),
            fill: true,
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            borderColor: 'rgba(0, 123, 255, 1)',
        }],
    };

    const newCustomersData = {
        labels: stats.charts.newCustomers.map(c => c._id),
        datasets: [{
            label: 'New Customers',
            data: stats.charts.newCustomers.map(c => c.count),
            borderColor: 'rgba(40, 167, 69, 1)',
            tension: 0.1,
        }],
    };

    const revenueByCategoryData = {
        labels: stats.charts.revenueByCategory.map(c => c._id),
        datasets: [{
            label: 'Revenue',
            data: stats.charts.revenueByCategory.map(c => c.totalRevenue),
            backgroundColor: 'rgba(0, 123, 255, 0.5)',
        }],
    };

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };

    return (
        <>
            <Meta title="Admin Dashboard | MegaBasket" noIndex={true} />
            <div>
                <div className="dashboard-header">
                    <h1>Dashboard</h1>
                    <div className="date-range-picker">
                        <input type="date" name="startDate" value={dateRange.startDate} onChange={handleDateChange} />
                        <span>to</span>
                        <input type="date" name="endDate" value={dateRange.endDate} onChange={handleDateChange} />
                    </div>
                </div>
                <div className="dashboard-kpi-cards">
                    <div className="kpi-card">
                        <div className="kpi-card-icon" style={{backgroundColor: 'var(--primary-color)'}}><FiShoppingCart /></div>
                        <div className="kpi-card-info"><h3>{stats.kpis.totalOrders}</h3><p>Total Orders</p></div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-card-icon" style={{backgroundColor: 'var(--success-color)'}}><FiDollarSign /></div>
                        <div className="kpi-card-info"><h3>{formatCurrency(stats.kpis.totalRevenue)}</h3><p>Total Revenue</p></div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-card-icon" style={{backgroundColor: 'var(--info-color)'}}><FiUsers /></div>
                        <div className="kpi-card-info"><h3>{stats.kpis.totalCustomers}</h3><p>Total Customers</p></div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-card-icon" style={{backgroundColor: 'var(--warning-color)'}}><FiBox /></div>
                        <div className="kpi-card-info"><h3>{stats.kpis.totalProducts}</h3><p>Products in Stock</p></div>
                    </div>
                </div>

                <div className="dashboard-charts">
                    <div className="chart-container">
                        <h3>Sales Performance</h3>
                        <Line data={salesPerformanceData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                    <div className="chart-container">
                        <h3>Revenue by Category</h3>
                        <Bar data={revenueByCategoryData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                    <div className="chart-container">
                        <h3>Orders Breakdown</h3>
                        <Doughnut data={orderStatusData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                    <div className="chart-container">
                        <h3>New Customers Trend</h3>
                        <Line data={newCustomersData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>

                <div>
                    <h3>Recent Orders</h3>
                    <table className="recent-orders-table">
                        <thead>
                            <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            {stats.recentOrders.map(order => (
                                <tr key={order._id}>
                                    <td>#{order._id.substring(0, 8)}...</td>
                                    <td>{order.user?.name || 'N/A'}</td>
                                    <td>{formatCurrency(order.totalPrice)}</td>
                                    <td>{order.status}</td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default AdminDashboardPage;
