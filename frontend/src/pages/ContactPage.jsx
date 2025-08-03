import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Meta from '../components/Meta';
import { FaPhoneAlt, FaEnvelope, FaClock, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    orderId: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // This endpoint should be created on your backend to handle contact form submissions
      await axios.post('/api/contact', formData); 
      toast.success('Your message has been sent successfully!');
      setIsSubmitted(true);
      setFormData({ name: '', email: '', phone: '', orderId: '', subject: 'General Inquiry', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Meta title="Contact Us | MegaBasket" description="Get in touch with MegaBasket. We're here to help with your orders, refunds, technical issues, or any other feedback." />
      <div className="contact-page">
        <div className="container">
          <header className="contact-header">
            <h1>Contact Us</h1>
            <p>Have a question or need assistance? Fill out the form below or reach out to us through our direct channels. We're here to help!</p>
          </header>

          <div className="contact-main-wrapper">
            <div className="contact-content-grid">
              <div className="contact-form-container">
                {isSubmitted ? (
                  <div className="success-message">
                    <h3>Thank You!</h3>
                    <p>Your message has been received. Our team will get back to you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                      <label htmlFor="name">Full Name <span className="required">*</span></label>
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email Address <span className="required">*</span></label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="orderId">Order ID</label>
                      <input type="text" id="orderId" name="orderId" value={formData.orderId} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="subject">Inquiry Type</label>
                      <select id="subject" name="subject" value={formData.subject} onChange={handleChange}>
                        <option>General Inquiry</option>
                        <option>Order Issue</option>
                        <option>Refund</option>
                        <option>Technical Help</option>
                        <option>Feedback</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="message">Message <span className="required">*</span></label>
                      <textarea id="message" name="message" rows="6" value={formData.message} onChange={handleChange} required></textarea>
                    </div>
                    {/* In a real app, a CAPTCHA like reCAPTCHA would be integrated here for spam protection */}
                    <button type="submit" className="auth-button" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>

              <div className="contact-info-container">
                <h3>Direct Contact Information</h3>
                <div className="contact-info-item">
                  <FaPhoneAlt className="contact-info-icon" />
                  <div>
                    <h4>Customer Support</h4>
                    <p>1800-XXX-XXXX</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <FaEnvelope className="contact-info-icon" />
                  <div>
                    <h4>Email Us</h4>
                    <p>contact@megabasket.com</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <FaClock className="contact-info-icon" />
                  <div>
                    <h4>Support Hours</h4>
                    <p>Mon-Sat, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>

                <div className="social-media-section">
                  <h3>Connect With Us</h3>
                  <div className="social-media-icons">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="continue-shopping-prompt">
            <Link to="/" className="auth-button">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
