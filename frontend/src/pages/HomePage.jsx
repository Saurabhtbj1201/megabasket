import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import BannerSlider from '../components/BannerSlider';
import CategoryNav from '../components/CategoryNav';
import ProductCarousel from '../components/ProductCarousel';
import ProductGrid from '../components/ProductGrid';
import Meta from '../components/Meta';
import { FaArrowUp } from 'react-icons/fa';
import './HomePage.css';
import './AllCategoriesPage.css'; // For shared status styles
import { fetchWithCache } from '../utils/cacheUtils';

const HomePage = () => {
    const { userInfo } = useAuth();
    const [topOffers, setTopOffers] = useState([]);
    const [dynamicOffers, setDynamicOffers] = useState([]);
    const [productsByCategory, setProductsByCategory] = useState([]);
    const [recentlyVisited, setRecentlyVisited] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Add state to track recently visited ids from localStorage
    const [visitedIds, setVisitedIds] = useState(() => {
        return JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
    });

    // Add this useEffect to reset scroll position when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Add effect to listen for storage events
    useEffect(() => {
        // Function to update visitedIds when localStorage changes
        const handleStorageChange = () => {
            const updatedIds = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
            setVisitedIds(updatedIds);
        };

        // Set up event listener for changes to localStorage
        window.addEventListener('storage', handleStorageChange);

        // Check for changes every 5 seconds as a fallback (for same-tab navigation)
        const intervalId = setInterval(() => {
            const currentIds = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
            if (JSON.stringify(currentIds) !== JSON.stringify(visitedIds)) {
                setVisitedIds(currentIds);
            }
        }, 5000);

        // Clean up
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(intervalId);
        };
    }, [visitedIds]);

    useEffect(() => {
        const fetchHomePageData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch Top Offers with caching (2 hours expiry)
                const offersData = await fetchWithCache('/api/products/top-offers', 'topOffers', 7200000);
                setTopOffers(offersData);

                // Try to fetch dynamic offers with caching (1 hour expiry)
                try {
                    const dynamicOffersData = await fetchWithCache('/api/offers', 'dynamicOffers', 3600000);
                    setDynamicOffers(dynamicOffersData);
                } catch (offerError) {
                    console.log("Offers endpoint not available yet:", offerError);
                    setDynamicOffers([]);
                }

                // Fetch Categories with caching (24 hours expiry since they rarely change)
                const categoriesData = await fetchWithCache('/api/categories', 'categories', 86400000);
                
                // Fetch products for each category with caching (4 hours expiry)
                const categoryProductPromises = categoriesData.map(cat =>
                    fetchWithCache(`/api/products/category/${cat._id}`, `category_${cat._id}`, 14400000)
                );
                const categoryProducts = await Promise.all(categoryProductPromises);
                
                const productsByCat = categoriesData.map((cat, index) => ({
                    ...cat,
                    products: categoryProducts[index],
                }));
                setProductsByCategory(productsByCat);

            } catch (error) {
                console.error("Failed to fetch home page data", error);
                setError(`Failed to fetch home page data: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchHomePageData();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTopBtn = document.querySelector('#scroll-top');
            if (scrollTopBtn) {
                if (window.scrollY > 60) {
                    scrollTopBtn.classList.add('active');
                } else {
                    scrollTopBtn.classList.remove('active');
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchRecentlyVisited = async () => {
            if (userInfo) {
                // Using visitedIds state instead of reading from localStorage
                if (visitedIds.length > 0) {
                    try {
                        // Use cached product data if available
                        const allProducts = await fetchWithCache('/api/products', 'allProducts', 3600000);
                        const visitedProducts = allProducts.filter(p => visitedIds.includes(p._id));
                        // Preserve the order from localStorage
                        const orderedVisitedProducts = visitedIds
                            .map(id => visitedProducts.find(p => p._id === id))
                            .filter(Boolean);
                        setRecentlyVisited(orderedVisitedProducts.slice(0, 4));
                    } catch (error) {
                        console.error("Failed to fetch recently visited products", error);
                    }
                }
            }
        };
        fetchRecentlyVisited();
    }, [userInfo, visitedIds]); // Add visitedIds as dependency

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (error) {
        return (
            <div className="container">
                <div className="page-status-container error-container">
                    <div className="error-icon">!</div>
                    <h2>Something Went Wrong</h2>
                    <p>We're having trouble loading the page. Please check your connection and try again.</p>
                    <p className="error-details">Details: {error}</p>
                </div>
            </div>
        );
    }

    const dealsOfTheDay = dynamicOffers.find(o => o.type === 'DEAL_OF_THE_DAY');
    const customOffers = dynamicOffers.filter(o => o.type === 'CUSTOM_OFFER');

    return (
        <>
            <Meta />
            <div>
                <BannerSlider />
                <CategoryNav />
                <div className="container">

                    {userInfo && recentlyVisited.length > 0 && (
                        <div className="recommendations-container">
                            <ProductGrid title="Recently Visited" products={recentlyVisited} viewAllLink="/profile?tab=activity" />
                            <ProductGrid title="Similar Products" products={topOffers.slice(0, 4)} />
                            <ProductGrid title="Recommended For You" products={topOffers.slice(4, 8)} />
                        </div>
                    )}

                    
                    {/* Deals of the Day Carousel - Only show if exists */}
                    {dealsOfTheDay && dealsOfTheDay.products && dealsOfTheDay.products.length > 0 && (
                        <ProductCarousel 
                            title={dealsOfTheDay.title} 
                            products={dealsOfTheDay.products} 
                            viewAllLink="/products/offers#deals-of-day"
                        />
                    )}

                    {/* Custom Offers Carousels - Only show if they exist */}
                    {customOffers && customOffers.length > 0 && customOffers.map(offer => (
                        offer.products && offer.products.length > 0 && (
                            <ProductCarousel 
                                key={offer._id} 
                                title={offer.title} 
                                products={offer.products} 
                                viewAllLink={`/products/offers#offer-${offer._id}`}
                            />
                        )
                    ))}

                    

                    <ProductCarousel title="Top Offers" products={topOffers} viewAllLink="/products/offers" />

                    {productsByCategory.map(category => (
                        <ProductCarousel
                            key={category._id}
                            title={`Best Deals in ${category.name}`}
                            products={category.products}
                            viewAllLink={`/category/${category._id}`}
                        />
                    ))}

                    <ProductCarousel title="Explore More" products={topOffers.sort(() => 0.5 - Math.random())} />
                </div>
            </div>
            <button id="scroll-top" title="Go to top" onClick={scrollToTop}>
                <FaArrowUp />
            </button>
        </>
    );
};

export default HomePage;
