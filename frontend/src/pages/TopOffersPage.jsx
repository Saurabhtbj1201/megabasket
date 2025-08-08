import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from '../components/ProductCard';
import ProductCarousel from '../components/ProductCarousel';
import Meta from '../components/Meta';
import './TopOffersPage.css';
import './AllCategoriesPage.css'; // For shared status styles

const TopOffersPage = () => {
    const [products, setProducts] = useState([]);
    const [dynamicOffers, setDynamicOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    
    // Create refs for each section
    const dealsOfDayRef = useRef(null);
    const customOfferRefs = useRef({});

    useEffect(() => {
        const fetchOffers = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch both regular offers and dynamic offers (deals of the day, custom offers)
                const [offersRes, dynamicOffersRes] = await Promise.all([
                    axios.get('/api/products/top-offers'),
                    axios.get('/api/offers').catch(err => {
                        console.log("Offers endpoint may not be available:", err);
                        return { data: [] }; // Return empty array if endpoint fails
                    })
                ]);
                
                setProducts(offersRes.data);
                setDynamicOffers(dynamicOffersRes.data || []);
            } catch (err) {
                setError('Could not fetch offers. Please try again later.');
                toast.error('Could not fetch offers.');
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);
    
    // Effect to scroll to the appropriate section based on URL hash
    useEffect(() => {
        if (location.hash) {
            // Remove the # symbol
            const targetId = location.hash.substring(1);
            
            setTimeout(() => {
                if (targetId === 'deals-of-day' && dealsOfDayRef.current) {
                    dealsOfDayRef.current.scrollIntoView({ behavior: 'smooth' });
                } else if (targetId.startsWith('offer-') && customOfferRefs.current[targetId]) {
                    customOfferRefs.current[targetId].scrollIntoView({ behavior: 'smooth' });
                }
            }, 500); // Wait a bit for the page to fully render
        } else {
            // Scroll to top if no hash
            window.scrollTo(0, 0);
        }
    }, [location.hash, dynamicOffers]);

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

    // Extract deals of the day and custom offers
    const dealsOfTheDay = useMemo(() => dynamicOffers.find(o => o.type === 'DEAL_OF_THE_DAY'), [dynamicOffers]);
    const customOffers = useMemo(() => dynamicOffers.filter(o => o.type === 'CUSTOM_OFFER'), [dynamicOffers]);

    const getGroupTitle = (key) => {
        const discount = Number(key);
        if (discount >= 90) return "90% & Above";
        if (discount >= 10) return `${discount}% - ${discount + 9}% Discount`;
        return "Under 10% Discount";
    };

    if (loading) {
        return (
            <div className="preloader">
                <p>Loading Cart...</p>
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
                
                {/* Deals of the Day Section - Displayed directly in product-carousel-section */}
                {dealsOfTheDay && dealsOfTheDay.products && dealsOfTheDay.products.length > 0 && (
                    <div id="deals-of-day" ref={dealsOfDayRef} className="product-carousel-section">
                        <h2 className="section-title">Deals of the Day</h2>
                        <ProductCarousel 
                            products={dealsOfTheDay.products} 
                            responsiveOptions={[
                                { breakpoint: 1024, settings: { slidesToShow: 4 } },
                                { breakpoint: 768, settings: { slidesToShow: 3 } },
                                { breakpoint: 480, settings: { slidesToShow: 2 } }
                            ]}
                        />
                    </div>
                )}
                
                {/* Custom Offers Sections - Displayed directly in product-carousel-section */}
                {customOffers && customOffers.length > 0 && customOffers.map(offer => (
                    offer.products && offer.products.length > 0 && (
                        <div 
                            key={offer._id} 
                            id={`offer-${offer._id}`}
                            ref={el => customOfferRefs.current[`offer-${offer._id}`] = el}
                            className="product-carousel-section"
                        >
                            <h2 className="section-title">{offer.title}</h2>
                            <ProductCarousel 
                                title="" 
                                products={offer.products} 
                                responsiveOptions={[
                                    { breakpoint: 1024, settings: { slidesToShow: 4 } },
                                    { breakpoint: 768, settings: { slidesToShow: 3 } },
                                    { breakpoint: 480, settings: { slidesToShow: 2 } }
                                ]}
                            />
                        </div>
                    )
                ))}
                
                {/* Top Offers by Discount Percentage */}
                <h2 className="top-offers-section-title">Top Offers & Best Deals</h2>
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
