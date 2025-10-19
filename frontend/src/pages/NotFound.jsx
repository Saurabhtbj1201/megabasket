import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiSearch, FiArrowLeft } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './NotFound.css';

const NotFound = () => {
  return (
    <>
      <Header />
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="error-animation">
            <div className="error-number">
              <span className="four">4</span>
              <span className="zero">0</span>
              <span className="four">4</span>
            </div>
          </div>
          
          <div className="error-message">
            <h1>Oops! Page Not Found</h1>
            <p>The page you're looking for seems to have wandered off. Don't worry, even our best products sometimes get misplaced!</p>
          </div>
          
          <div className="error-actions">
            <Link to="/" className="btn btn-primary">
              <FiHome />
              Back to Home
            </Link>
            <Link to="/search" className="btn btn-secondary">
              <FiSearch />
              Search Products
            </Link>
            <button onClick={() => window.history.back()} className="btn btn-outline">
              <FiArrowLeft />
              Go Back
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
