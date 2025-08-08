import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import { FiFilter, FiX } from 'react-icons/fi';
import { FaArrowUp } from 'react-icons/fa';
import Meta from '../components/Meta';
import './SearchPage.css';
import '@/pages/CategoryPage.css'; // Reusing some styles like overlay
import './AllCategoriesPage.css'; // For shared status styles

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        price: { min: '', max: '' },
        categories: [],
        subCategories: [],
        tags: [],
        brands: [],
        colors: [],
    });

    const query = searchParams.get('q');

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
        const fetchPageData = async () => {
            if (query) {
                setLoading(true);
                setError(null);
                try {
                    const [productsRes, categoriesRes, subCategoriesRes] = await Promise.all([
                        axios.get(`/api/products/search?keyword=${query}`),
                        axios.get('/api/categories'),
                        axios.get('/api/subcategories')
                    ]);
                    setProducts(productsRes.data);
                    setAllCategories(categoriesRes.data);
                    setAllSubCategories(subCategoriesRes.data);
                } catch (error) {
                    toast.error('Could not fetch search results.');
                    setError(`Failed to fetch search results: ${error.message}`);
                } finally {
                    setLoading(false);
                }
            } else {
                setProducts([]);
                setLoading(false);
            }
        };
        fetchPageData();
    }, [query]);

    const filteredProducts = useMemo(() => {
        const selectedCategoryIds = allCategories
            .filter(c => filters.categories.includes(c.name))
            .map(c => c._id);
        
        const selectedSubCategoryIds = allSubCategories
            .filter(sc => filters.subCategories.includes(sc.name))
            .map(sc => sc._id);

        return products.filter(product => {
            const finalPrice = product.price - (product.price * product.discount / 100);
            const { price, tags, brands, colors } = filters;

            if (price.min && finalPrice < price.min) return false;
            if (price.max && finalPrice > price.max) return false;
            
            const productCategoryId = product.category?._id || product.category;
            if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(productCategoryId)) return false;

            if (selectedSubCategoryIds.length > 0 && !product.subCategory.some(scId => selectedSubCategoryIds.includes(scId))) return false;

            if (brands.length > 0 && !brands.includes(product.brand)) return false;
            if (colors.length > 0 && !colors.includes(product.color)) return false;
            if (tags.length > 0 && !tags.some(tag => product.tags.includes(tag))) return false;

            return true;
        });
    }, [products, filters, allCategories, allSubCategories]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="page-status-container">
                    <div className="loader"></div>
                    <p className="loading-text">Finding products...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="page-status-container error-container">
                    <div className="error-icon">!</div>
                    <h2>Search Unavailable</h2>
                    <p>We're having trouble with our search right now. Please try again in a moment.</p>
                    <p className="error-details">Details: {error}</p>
                </div>
            );
        }

        if (filteredProducts.length > 0) {
            return (
                <div className="search-results-grid">
                    {filteredProducts.map(product => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            );
        }
        return (
            <div className="page-status-container">
                <h3>No products found for "{query}"</h3>
                <p>Try checking your spelling or using more general terms.</p>
            </div>
        );
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <Meta 
                title={`Search results for "${query}" | MegaBasket`}
                description={`Find products matching "${query}" on MegaBasket. Great prices and selection.`}
                keywords={`search, ${query}, products`}
            />
            <div className="container">
                <h1 className="search-page-title">Search Results for "{query}"</h1>
                <button className="filter-toggle-btn auth-button" onClick={() => setIsFilterOpen(true)}>
                    <FiFilter /> Filters
                </button>
                <div className={`filter-overlay ${isFilterOpen ? 'open' : ''}`} onClick={() => setIsFilterOpen(false)}></div>
                <div className="search-page-container">
                    <aside className={`filter-sidebar ${isFilterOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button className="close-filter-btn" onClick={() => setIsFilterOpen(false)}><FiX /></button>
                        <FilterSidebar products={products} allCategories={allCategories} allSubCategories={allSubCategories} onFilterChange={setFilters} />
                    </aside>
                    <div className="search-results">
                        {renderContent()}
                    </div>
                </div>
            </div>
            <button id="scroll-top" title="Go to top" onClick={scrollToTop}>
                <FaArrowUp />
            </button>
        </>
    );
};

export default SearchPage;

