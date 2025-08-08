import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CategoryNav.css';

const CategoryNav = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/categories');
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="category-nav-container">
      <div className="category-list">
        {categories.map(category => (
          <Link to={`/category/${category._id}`} key={category._id} className="category-item">
            <img src={category.image} alt={category.name} />
            <p>{category.name}</p>
          </Link>
        ))}
        <Link to="/all-categories" className="category-item view-all-item">
          <div className="view-all-circle">
            <span>+</span>
          </div>
          <p>View All</p>
        </Link>
      </div>
    </div>
  );
};

export default CategoryNav;
