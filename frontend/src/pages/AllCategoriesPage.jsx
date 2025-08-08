import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaArrowUp } from 'react-icons/fa';
import Meta from '../components/Meta';
import './AllCategoriesPage.css';

const AllCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching categories and subcategories...');
        const [categoriesRes, subCategoriesRes] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/subcategories')
        ]);
        
        console.log('Categories fetched:', categoriesRes.data);
        console.log('Subcategories fetched:', subCategoriesRes.data);
        
        if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
          setCategories(categoriesRes.data);
        } else {
          console.error('Invalid categories data format:', categoriesRes.data);
          setError('Failed to load categories data');
        }
        
        if (subCategoriesRes.data && Array.isArray(subCategoriesRes.data)) {
          setSubCategories(subCategoriesRes.data);
        } else {
          console.error('Invalid subcategories data format:', subCategoriesRes.data);
          setError('Failed to load subcategories data');
        }
      } catch (error) {
        console.error('Failed to fetch categories and subcategories', error);
        setError(`Error loading data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  // Group subcategories by category
  const getCategorySubcategories = (categoryId) => {
    if (!subCategories || !Array.isArray(subCategories)) {
      console.log('Subcategories not available for filtering');
      return [];
    }
    
    const filtered = subCategories.filter(sub => 
      sub.categories && Array.isArray(sub.categories) && 
      sub.categories.some(cat => 
        // Handle both object references and direct IDs
        (typeof cat === 'object' ? cat._id === categoryId : cat === categoryId)
      )
    );
    
    console.log(`Subcategories for category ${categoryId}:`, filtered);
    return filtered;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="preloader">
        <p>Loading Categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="page-status-container error-container">
          <div className="error-icon">!</div>
          <h2>Something Went Wrong</h2>
          <p>We're having trouble loading categories right now. Please check your connection and try again.</p>
          <p className="error-details">Details: {error}</p>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return <div className="container"><p>No categories available.</p></div>;
  }

  return (
    <>
      <Meta 
        title="All Categories | MegaBasket" 
        description="Browse all product categories and subcategories on MegaBasket"
      />
      <div className="container">
        <h1 className="all-categories-title">All Categories</h1>
        
        {categories.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          <div className="all-categories-container">
            {categories.map(category => (
              <div key={category._id} className="category-section">
                <Link to={`/category/${category._id}`} className="category-header">
                  <img src={category.image} alt={category.name} />
                  <h2>{category.name}</h2>
                </Link>
                
                <div className="subcategory-grid">
                  {getCategorySubcategories(category._id).length > 0 ? (
                    getCategorySubcategories(category._id).map(subCategory => (
                      <Link 
                        key={subCategory._id} 
                        to={`/category/${category._id}?subcategory=${subCategory._id}`} 
                        className="subcategory-item"
                      >
                        <img src={subCategory.image} alt={subCategory.name} />
                        <p>{subCategory.name}</p>
                      </Link>
                    ))
                  ) : (
                    <p className="no-subcategories">No subcategories available for this category</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button id="scroll-top" title="Go to top" onClick={scrollToTop}>
        <FaArrowUp />
      </button>
    </>
  );
};

export default AllCategoriesPage;
