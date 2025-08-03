import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './BannerSlider.css';

const BannerSlider = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get('/api/banners');
        setBanners(data);
      } catch (error) {
        console.error('Failed to fetch banners');
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 5000); // Change slide every 5 seconds
      return () => clearTimeout(timer);
    }
  }, [currentIndex, banners.length]);

  if (banners.length === 0) {
    return (
      <div className="banner-slider-placeholder">
        <p>Loading Banners...</p>
      </div>
    );
  }

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  return (
    <div className="banner-slider">
      <div className="banner-slider-wrapper" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {banners.map((banner) => {
          const linkTo = banner.product ? `/product/${banner.product._id}` : (banner.category ? `/category/${banner.category._id}` : '/');
          return (
            <Link to={linkTo} key={banner._id} className="banner-item">
              <img src={banner.image} alt={banner.title} className="banner-background-image" />
              <div className="banner-overlay"></div>
              <div className="banner-content">
                <h2>{banner.title}</h2>
                <p>{banner.description}</p>
                <button className="banner-button">Shop Now</button>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="banner-dots">
        {banners.map((_, slideIndex) => (
          <div
            key={slideIndex}
            className={`banner-dot ${currentIndex === slideIndex ? 'active' : ''}`}
            onClick={() => goToSlide(slideIndex)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
