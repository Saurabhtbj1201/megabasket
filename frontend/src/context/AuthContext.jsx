import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();
    const notificationSound = useRef(null);

    // Initialize the Audio object once.
    useEffect(() => {
        notificationSound.current = new Audio('/notification.mp3');
    }, []);

    const fetchNotifications = async (token, isInitial = false) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/notifications', config);
            
            if (!isInitial && data.length > notifications.length) {
                const newNotification = data[0];
                if (!newNotification.isRead) {
                    notificationSound.current.play().catch(error => {
                        // Autoplay was prevented.
                        console.log("Notification sound was blocked by the browser.");
                    });
                    if (Notification.permission === 'granted') {
                        new Notification('MegaBasket Notification', {
                            body: newNotification.message,
                            icon: '/vite.svg'
                        });
                    }
                }
            }
            setNotifications(data);
        } catch (error) {
            console.error("Could not fetch notifications.");
        }
    };

    useEffect(() => {
        const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (storedUserInfo) {
            setUserInfo(storedUserInfo);
            fetchCartCount(storedUserInfo.token);
            fetchNotifications(storedUserInfo.token, true);
            
            const interval = setInterval(() => {
                fetchNotifications(storedUserInfo.token);
            }, 30000); // Poll every 30 seconds

            return () => clearInterval(interval);
        }
    }, []);

    const login = (userData) => {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setUserInfo(userData);
        fetchCartCount(userData.token);
        fetchNotifications(userData.token, true);
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('currentAddress');
        setUserInfo(null);
        setCartCount(0);
        setNotifications([]);
        navigate('/login');
    };

    const updateUserInfo = (updatedData) => {
        const newInfo = { ...userInfo, ...updatedData };
        localStorage.setItem('userInfo', JSON.stringify(newInfo));
        setUserInfo(newInfo);
    };

    const fetchCartCount = async (token) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('/api/cart', config);
            const count = data.reduce((acc, item) => acc + item.quantity, 0);
            setCartCount(count);
        } catch (error) {
            console.error("Could not fetch cart count.");
        }
    };

    const value = {
        userInfo,
        cartCount,
        setCartCount,
        notifications,
        setNotifications,
        login,
        logout,
        updateUserInfo,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
