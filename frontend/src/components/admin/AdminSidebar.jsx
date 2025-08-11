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
                
                // If we need to fetch offers count separately
                let offerCount = data.offers;
                
                // If offers count is missing, fetch it directly from offers endpoint
                if (!offerCount) {
                    try {
                        const offersResponse = await axios.get('/api/offers', config);
                        // Count total products in all offers
                        let totalProducts = 0;
                        
                        // Process deals of the day
                        const dealsOffer = offersResponse.data.find(o => o.type === 'DEAL_OF_THE_DAY');
                        if (dealsOffer && dealsOffer.products) {
                            totalProducts += dealsOffer.products.length;
                        }
                        
                        // Process custom offers
                        const customOffers = offersResponse.data.filter(o => o.type === 'CUSTOM_OFFER');
                        customOffers.forEach(offer => {
                            if (offer.products) {
                                totalProducts += offer.products.length;
                            }
                        });
                        
                        // Set the count with updated offers
                        setCounts({...data, offers: totalProducts});
                    } catch (offerError) {
                        console.error("Failed to fetch offers count:", offerError);
                        setCounts(data);
                    }
                } else {
                    setCounts(data);
                }
            } catch (error) {
                console.error("Failed to fetch admin counts:", error);
            }
        };
        fetchCounts();
    }, []);

    return (
        <aside ref={sidebarRef} className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
            <nav>
                <ul>
                    <li><NavLink to="/admin/dashboard">Dashboard</NavLink></li>
                    <li><NavLink to="/admin/orders">Orders <span className="sidebar-count-badge">{counts?.orders}</span></NavLink></li>
                    <li><NavLink to="/admin/products">Products <span className="sidebar-count-badge">{counts?.products}</span></NavLink></li>
                    <li><NavLink to="/admin/categories">Categories <span className="sidebar-count-badge">{counts?.categories}</span></NavLink></li>
                    <li><NavLink to="/admin/subcategories">Sub Categories <span className="sidebar-count-badge">{counts?.subCategories}</span></NavLink></li>
                    <li><NavLink to="/admin/offers">Offers <span className="sidebar-count-badge">{counts?.offers}</span></NavLink></li>
                    <li><NavLink to="/admin/banners">Banners <span className="sidebar-count-badge">{counts?.banners}</span></NavLink></li>
                    <li><NavLink to="/admin/users">Users <span className="sidebar-count-badge">{counts?.users}</span></NavLink></li>
                    <li><NavLink to="/admin/profile">Admin Profile</NavLink></li>
                    <li><NavLink to="/admin/contact">Contact Messages <span className="sidebar-count-badge">{counts?.contactMessages}</span></NavLink></li>
                    <li><NavLink to="/admin/promotional-mail">Promotional Mail</NavLink></li>
                </ul>
            </nav>
        </aside>
    );
};

export default AdminSidebar;
