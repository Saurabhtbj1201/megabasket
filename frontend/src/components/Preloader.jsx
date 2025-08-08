import React from 'react';
import './Preloader.css';

const Preloader = ({ message = 'Loading content...' }) => {
  return (
    <div className="preloader-container">
      <div className="preloader-spinner">
        <div className="spinner-circle"></div>
        <div className="spinner-circle-inner"></div>
      </div>
      <p className="preloader-message">{message}</p>
    </div>
  );
};

export default Preloader;
