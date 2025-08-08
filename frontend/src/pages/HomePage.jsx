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

const HomePage = () => {
    const { userInfo } = useAuth();
    const [topOffers, setTopOffers] = useState([]);
    const [dynamicOffers, setDynamicOffers] = useState([]);
    const [productsByCategory, setProductsByCategory] = useState([]);
    const [recentlyVisited, setRecentlyVisited] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Add this useEffect to reset scroll position when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const fetchHomePageData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch Top Offers
                const { data: offersData } = await axios.get('/api/products/top-offers');
                setTopOffers(offersData);

                // Try to fetch dynamic offers, but don't fail if endpoint doesn't exist yet
                try {
                    const { data: dynamicOffersData } = await axios.get('/api/offers');
                    setDynamicOffers(dynamicOffersData);
                } catch (offerError) {
                    console.log("Offers endpoint not available yet:", offerError);
                    // Set empty array for offers - this is expected if the endpoint isn't set up yet
                    setDynamicOffers([]);
                }

                // Fetch Categories and then products for each
                const { data: categoriesData } = await axios.get('/api/categories');
                
                // Fix: categoriesData is already the array, not categoriesData.data
                const categoryProductPromises = categoriesData.map(cat =>
                    axios.get(`/api/products/category/${cat._id}`)
                );
                const categoryProductResponses = await Promise.all(categoryProductPromises);
                
                const productsByCat = categoriesData.map((cat, index) => ({
                    ...cat,
                    products: categoryProductResponses[index].data,
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
                const visitedIds = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
                if (visitedIds.length > 0) {
                    // In a real app, you might fetch these from a dedicated endpoint
                    // For now, we'll filter from all products if available, or fetch individually
                    // This is a simplified example.
                    const { data: allProducts } = await axios.get('/api/products');
                    const visitedProducts = allProducts.filter(p => visitedIds.includes(p._id));
                    setRecentlyVisited(visitedProducts.slice(0, 4));
                }
            }
        };
        fetchRecentlyVisited();
    }, [userInfo]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="page-status-container">
                <div className="loader"></div>
                <p className="loading-text">Loading Home Page...</p>
            </div>
        );
    }

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

                    {userInfo && recentlyVisited.length > 0 && (
                        <div className="recommendations-container">
                            <ProductGrid title="Recently Visited" products={recentlyVisited} viewAllLink="/profile?tab=activity" />
                            <ProductGrid title="Similar Products" products={topOffers.slice(0, 4)} />
                            <ProductGrid title="Recommended For You" products={topOffers.slice(4, 8)} />
                        </div>
                    )}

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
