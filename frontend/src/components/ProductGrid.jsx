import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';

const ProductGrid = ({ title, products, viewAllLink }) => {
    if (!products || products.length === 0) return null;

    return (
        <div className="recommendation-grid">
            <div className="section-header">
                <h2>{title}</h2>
                {viewAllLink && <Link to={viewAllLink} className="view-all-btn">View All</Link>}
            </div>
            <div className="product-grid">
                {products.slice(0, 4).map(product => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default ProductGrid;
