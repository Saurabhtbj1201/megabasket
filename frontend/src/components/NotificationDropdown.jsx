import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const NotificationDropdown = ({ onClose }) => {
    const { notifications, setNotifications } = useAuth();
    const navigate = useNavigate();

    const handleMarkAllAsRead = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put('/api/notifications/read', {}, config);
            setNotifications(data);
        } catch (error) {
            console.error("Failed to mark notifications as read");
        }
    };

    const handleNotificationClick = (notif) => {
        if (notif.link) {
            navigate(notif.link);
        }
        onClose();
    };

    return (
        <div className="notification-dropdown">
            <div className="notification-dropdown-header">
                <h3>Notifications</h3>
                <button onClick={handleMarkAllAsRead}>Mark all as read</button>
            </div>
            {notifications.length > 0 ? (
                notifications.slice(0, 5).map(notif => (
                    <div 
                        key={notif._id} 
                        className={`notification-item ${!notif.isRead ? 'unread' : ''}`} 
                        onClick={() => handleNotificationClick(notif)}
                        style={{ cursor: 'pointer' }}
                    >
                        <p>{notif.message}</p>
                        <small>{new Date(notif.createdAt).toLocaleString()}</small>
                    </div>
                ))
            ) : (
                <div className="no-notifications">
                    <p>No new notifications.</p>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
