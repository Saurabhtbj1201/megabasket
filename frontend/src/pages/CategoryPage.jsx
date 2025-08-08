import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import { FiFilter, FiX } from 'react-icons/fi';
import { FaArrowUp } from 'react-icons/fa';
import Meta from '../components/Meta';
import './CategoryPage.css';

const CategoryPage = () => {
    const { categoryId } = useParams();
    const [searchParams] = useSearchParams();
    const subcategoryParam = searchParams.get('subcategory');
    const [products, setProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        price: { min: '', max: '' },
        categories: [],
        tags: [],
        brands: [],
        colors: [],
    });
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [categoriesRes, subCategoriesRes] = await Promise.all([
                    axios.get('/api/categories'),
                    axios.get('/api/subcategories'),
                ]);
                setAllCategories(categoriesRes.data);
                setSubCategories(subCategoriesRes.data);
                const currentCat = categoriesRes.data.find(c => c._id === categoryId);
                setCategoryName(currentCat?.name || 'Category');
                setSelectedSubCategoryId(subcategoryParam); // Set from URL param
            } catch (error) {
                toast.error('Could not fetch page data.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [categoryId, subcategoryParam]);

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
        const fetchProducts = async () => {
            setLoading(true);
            // If no categories are selected in filter, use the one from the URL param
            const categoryIdsToFetch = filters.categories.length > 0 
                ? allCategories.filter(c => filters.categories.includes(c.name)).map(c => c._id)
                : [categoryId];

            if (categoryIdsToFetch.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            try {
                const { data } = await axios.get(`/api/products/categories?ids=${categoryIdsToFetch.join(',')}`);
                setProducts(data);
            } catch (error) {
                toast.error('Could not fetch products.');
            } finally {
                setLoading(false);
            }
        };

        if (allCategories.length > 0) {
            fetchProducts();
        }
    }, [categoryId, filters.categories, allCategories]);

    const currentSubCategories = useMemo(() => {
        if (!categoryId || subCategories.length === 0) return [];
        return subCategories.filter(sub => sub.categories.some(cat => cat._id === categoryId));
    }, [subCategories, categoryId]);

    const filteredProducts = useMemo(() => {
        // Category filter is now handled by the API call, so we only apply other filters here.
        return products.filter(product => {
            const finalPrice = product.price - (product.price * product.discount / 100);
            const { price, tags, brands, colors } = filters;

            if (price.min && finalPrice < price.min) return false;
            if (price.max && finalPrice > price.max) return false;
            if (brands.length > 0 && !brands.includes(product.brand)) return false;
            if (colors.length > 0 && !colors.includes(product.color)) return false;
            if (tags.length > 0 && !tags.some(tag => product.tags.includes(tag))) return false;

            if (selectedSubCategoryId && !product.subCategory.includes(selectedSubCategoryId)) return false;

            return true;
        });
    }, [products, filters, selectedSubCategoryId]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <Meta 
                title={`${categoryName} | MegaBasket`}
                description={`Shop for ${categoryName} on MegaBasket. Find great deals and a wide selection of products.`}
                keywords={`${categoryName}, online shopping, products`}
            />
            <div className="container">
                <h1 className="category-page-title">{categoryName}</h1>

                {currentSubCategories.length > 0 && (
                    <div className="sub-category-nav-container">
                        <div className="sub-category-list">
                            <button
                                className={`sub-category-item ${!selectedSubCategoryId ? 'active' : ''}`}
                                onClick={() => setSelectedSubCategoryId(null)}
                            >
                                <div className="sub-category-image-wrapper all">
                                    <span>All</span>
                                </div>
                                <p>All</p>
                            </button>
                            {currentSubCategories.map(sub => (
                                <button
                                    key={sub._id}
                                    className={`sub-category-item ${selectedSubCategoryId === sub._id ? 'active' : ''}`}
                                    onClick={() => setSelectedSubCategoryId(sub._id)}
                                >
                                    <div className="sub-category-image-wrapper">
                                        <img src={sub.image} alt={sub.name} />
                                    </div>
                                    <p>{sub.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button className="filter-toggle-btn auth-button" onClick={() => setIsFilterOpen(true)}>
                    <FiFilter /> Filters
                </button>
                <div className={`filter-overlay ${isFilterOpen ? 'open' : ''}`} onClick={() => setIsFilterOpen(false)}></div>
                <div className="category-page-container">
                    <aside className={`filter-sidebar ${isFilterOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <button className="close-filter-btn" onClick={() => setIsFilterOpen(false)}><FiX /></button>
                        <FilterSidebar products={products} allCategories={allCategories} onFilterChange={setFilters} />
                    </aside>
                    <div className="category-results">
                        {loading ? (
                            <p>Loading products...</p>
                        ) : filteredProducts.length > 0 ? (
                            <div className="category-product-grid">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <p>No products found in this category matching your criteria.</p>
                        )}
                    </div>
                </div>
            </div>
            <button id="scroll-top" title="Go to top" onClick={scrollToTop}>
                <FaArrowUp />
            </button>
        </>
    );
};

export default CategoryPage;
