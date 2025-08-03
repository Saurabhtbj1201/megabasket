import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };
  
  return (
    <footer className="footer">

      <div className="container footer-content">
        <div className="footer-section">
          <h4>Get to Know Us</h4>
          <Link to="/about" onClick={scrollToTop}>About Us</Link>
          <Link to="/contact" onClick={scrollToTop}>Contact Us</Link>
        </div>
        <div className="footer-section">
          <h4>Customer Support</h4>
          <Link to="/faq" onClick={scrollToTop}>Help Center / FAQs</Link>
          <Link to="/return-policy" onClick={scrollToTop}>Return & Refund Policy</Link>
          <Link to="/cancellation-policy" onClick={scrollToTop}>Order Cancellation Policy</Link>
        </div>
        <div className="footer-section">
          <h4>Legal Links</h4>
          <Link to="/terms" onClick={scrollToTop}>Terms & Conditions</Link>
          <Link to="/privacy" onClick={scrollToTop}>Privacy Policy</Link>
          <Link to="/cookie-policy" onClick={scrollToTop}>Cookie Policy</Link>
        </div>
        <div className="footer-section">
          <h4>Contact Details</h4>
          <p>Email: support@megabasket.com</p>
          <p>NH 376, Supaul, Bihar, 852139</p>
        </div>
        <div className="footer-section">
            <h4>Trust & Security</h4>
            <div className="trust-badges">
                {/* Replace with actual badge images */}
                <img src="./visa.png" alt="Visa" />
                <img src="./mastercard.png" alt="MasterCard" />
                <img src="./rupay.png" alt="Rupay" />
                <img src="./upi.png" alt="UPI" />
                <img src="./ssl.png" alt="SSL Secured" />
            </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} MegaBasket. All Rights Reserved.</p>
        
      </div>
    </footer>
  );
};

export default Footer;
