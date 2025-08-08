import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from '../components/ProductCard';
import Meta from '../components/Meta';
import './TopOffersPage.css';
import './AllCategoriesPage.css'; // For shared status styles

const TopOffersPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOffers = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get('/api/products/top-offers');
                setProducts(data);
            } catch (err) {
                setError('Could not fetch offers. Please try again later.');
                toast.error('Could not fetch offers.');
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    const groupedProducts = useMemo(() => {
        if (products.length === 0) return [];

        const groups = {
            90: [], 80: [], 70: [], 60: [], 50: [], 40: [], 30: [], 20: [], 10: [], 0: []
        };

        products.forEach(product => {
            const discount = product.discount;
            if (discount >= 90) groups[90].push(product);
            else if (discount >= 80) groups[80].push(product);
            else if (discount >= 70) groups[70].push(product);
            else if (discount >= 60) groups[60].push(product);
            else if (discount >= 50) groups[50].push(product);
            else if (discount >= 40) groups[40].push(product);
            else if (discount >= 30) groups[30].push(product);
            else if (discount >= 20) groups[20].push(product);
            else if (discount >= 10) groups[10].push(product);
            else if (discount > 0) groups[0].push(product);
        });

        return Object.entries(groups)
            .filter(([, products]) => products.length > 0)
            .sort(([a], [b]) => b - a);

    }, [products]);

    const getGroupTitle = (key) => {
        const discount = Number(key);
        if (discount >= 90) return "90% & Above";
        if (discount >= 10) return `${discount}% - ${discount + 9}% Discount`;
        return "Under 10% Discount";
    };

    if (loading) {
        return (
            <div className="page-status-container">
                <div className="loader"></div>
                <p className="loading-text">Loading Top Offers...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="page-status-container error-container">
                    <div className="error-icon">!</div>
                    <h2>Something Went Wrong</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Meta title="Top Offers | MegaBasket" description="Explore the best deals and discounts available on MegaBasket. Save big on your favorite products." />
            <div className="container">
                <h1 className="top-offers-page-title">Top Offers & Best Deals</h1>
                {groupedProducts.length > 0 ? (
                    <div className="offers-container">
                        {groupedProducts.map(([key, products]) => (
                            <section key={key} className="discount-section">
                                <h2 className="discount-section-title">{getGroupTitle(key)}</h2>
                                <div className="offers-product-grid">
                                    {products.map(product => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <p>No special offers available at the moment. Please check back later!</p>
                )}
            </div>
        </>
    );
};

export default TopOffersPage;
