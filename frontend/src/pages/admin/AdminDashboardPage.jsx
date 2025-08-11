import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiUsers, FiBox, FiDollarSign, FiArrowRight } from 'react-icons/fi';
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

    if (loading) return (
        <div className="dashboard-container">
            <div className="loading-spinner">Loading dashboard data...</div>
        </div>
    );
    
    if (!stats) return (
        <div className="dashboard-container">
            <div className="error-message">Could not load dashboard data. Please try again later.</div>
        </div>
    );

    // Chart options and configuration
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 5,
                right: 15,
                bottom: 5,
                left: 5
            }
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 11
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#333',
                bodyColor: '#666',
                bodyFont: {
                    size: 13
                },
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                padding: 12,
                boxPadding: 6,
                borderColor: '#e9e9e9',
                borderWidth: 1,
                usePointStyle: true,
                displayColors: true
            }
        }
    };

    const orderStatusData = {
        labels: stats.charts.orderStatusBreakdown.map(s => s._id),
        datasets: [{
            label: 'Orders',
            data: stats.charts.orderStatusBreakdown.map(s => s.count),
            backgroundColor: [
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 99, 132, 0.8)',
                'rgba(255, 159, 64, 0.8)'
            ],
            borderWidth: 1,
            borderColor: '#fff'
        }],
    };

    const salesPerformanceData = {
        labels: stats.charts.salesPerformance.map(s => s._id),
        datasets: [{
            label: 'Revenue',
            data: stats.charts.salesPerformance.map(s => s.totalRevenue),
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.4,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        }],
    };

    const newCustomersData = {
        labels: stats.charts.newCustomers.map(c => c._id),
        datasets: [{
            label: 'New Customers',
            data: stats.charts.newCustomers.map(c => c.count),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        }],
    };

    const revenueByCategoryData = {
        labels: stats.charts.revenueByCategory.map(c => c._id),
        datasets: [{
            label: 'Revenue',
            data: stats.charts.revenueByCategory.map(c => c.totalRevenue),
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
            ],
            borderWidth: 1,
            borderColor: '#fff'
        }],
    };

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };

    // Helper function to get status class
    const getStatusClass = (status) => {
        const statusMap = {
            'Pending': 'status-pending',
            'Processing': 'status-processing',
            'Shipped': 'status-shipped',
            'Delivered': 'status-delivered',
            'Cancelled': 'status-cancelled'
        };
        return statusMap[status] || '';
    };

    return (
        <>
            <Meta title="Admin Dashboard | MegaBasket" noIndex={true} />
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>Dashboard Overview</h1>
                    <div className="date-range-picker">
                        <input 
                            type="date" 
                            name="startDate" 
                            value={dateRange.startDate} 
                            onChange={handleDateChange} 
                        />
                        <span>to</span>
                        <input 
                            type="date" 
                            name="endDate" 
                            value={dateRange.endDate} 
                            onChange={handleDateChange} 
                        />
                    </div>
                </div>
                
                <div className="dashboard-kpi-cards">
                    <div className="kpi-card orders">
                        <div className="kpi-card-icon" style={{backgroundColor: 'var(--primary-color)'}}>
                            <FiShoppingCart />
                        </div>
                        <div className="kpi-card-info">
                            <h3>{stats.kpis.totalOrders}</h3>
                            <p>Total Orders</p>
                        </div>
                    </div>
                    
                    <div className="kpi-card revenue">
                        <div className="kpi-card-icon" style={{backgroundColor: 'var(--success-color)'}}>
                            <FiDollarSign />
                        </div>
                        <div className="kpi-card-info">
                            <h3>{formatCurrency(stats.kpis.totalRevenue)}</h3>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                    
                    <div className="kpi-card customers">
                        <div className="kpi-card-icon" style={{backgroundColor: 'var(--info-color)'}}>
                            <FiUsers />
                        </div>
                        <div className="kpi-card-info">
                            <h3>{stats.kpis.totalCustomers}</h3>
                            <p>Total Customers</p>
                        </div>
                    </div>
                    
                    <div className="kpi-card products">
                        <div className="kpi-card-icon" style={{backgroundColor: 'var(--warning-color)'}}>
                            <FiBox />
                        </div>
                        <div className="kpi-card-info">
                            <h3>{stats.kpis.totalProducts}</h3>
                            <p>Products in Stock</p>
                        </div>
                    </div>
                </div>

                <div className="dashboard-charts">
                    <div className="chart-container">
                        <h3>Sales Performance</h3>
                        <div className="chart-wrapper">
                            <Line data={salesPerformanceData} options={chartOptions} />
                        </div>
                    </div>
                    
                    <div className="chart-container">
                        <h3>Revenue by Category</h3>
                        <div className="chart-wrapper">
                            <Bar data={revenueByCategoryData} options={chartOptions} />
                        </div>
                    </div>
                    
                    <div className="chart-container">
                        <h3>Orders Breakdown</h3>
                        <div className="chart-wrapper">
                            <Doughnut data={orderStatusData} options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    legend: {
                                        ...chartOptions.plugins.legend,
                                        position: 'right'
                                    }
                                }
                            }} />
                        </div>
                    </div>
                    
                    <div className="chart-container">
                        <h3>New Customers Trend</h3>
                        <div className="chart-wrapper">
                            <Line data={newCustomersData} options={chartOptions} />
                        </div>
                    </div>
                </div>

                <div className="recent-orders-section">
                    <div className="recent-orders-header">
                        <h3>Recent Orders</h3>
                        <a href="/admin/orders" className="view-all-link">
                            View All Orders <FiArrowRight />
                        </a>
                    </div>
                    
                    <table className="recent-orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentOrders.map(order => (
                                <tr key={order._id}>
                                    <td>
                                        <span className="order-id">
                                            #{order._id.substring(0, 8)}
                                        </span>
                                    </td>
                                    <td>{order.user?.name || 'Guest'}</td>
                                    <td>{formatCurrency(order.totalPrice)}</td>
                                    <td>
                                        <span className={`order-status ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
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
