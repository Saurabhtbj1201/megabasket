import React, { useEffect, useRef, useState } from 'react';
import './LazyImage.css';

const LazyImage = ({ src, alt, className, placeholderSrc, ...props }) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { 
      rootMargin: '200px 0px', // Start loading when image is 200px from viewport
      threshold: 0.01 
    });
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (imgRef.current) {
        observer.disconnect();
      }
    };
  }, []);
  
  return (
    <div 
      ref={imgRef} 
      className={`lazy-image-container ${className || ''}`} 
      {...props}
    >
      {isInView ? (
        <img 
          src={src} 
          alt={alt || 'Product image'} 
          className={`lazy-image ${isLoaded ? 'loaded' : ''}`} 
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <div className="lazy-image-placeholder">
          {placeholderSrc && (
            <img src={placeholderSrc} alt="Loading" className="placeholder-img" />
          )}
        </div>
      )}
    </div>
  );
};

export default LazyImage;
