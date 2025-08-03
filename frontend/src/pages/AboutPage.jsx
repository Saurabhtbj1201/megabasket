import React from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/Meta';
import { FaShippingFast, FaShieldAlt, FaRecycle, FaTags } from 'react-icons/fa';
import './AboutPage.css';

const testimonials = [
  {
    quote: "MegaBasket has changed the way I shop! The delivery is always on time, and the product quality is excellent. Highly recommended!",
    author: "- Sarah J.",
    rating: "★★★★★"
  },
  {
    quote: "An amazing selection of products at great prices. The customer service is top-notch and very helpful. A five-star experience!",
    author: "- Mark T.",
    rating: "★★★★★"
  },
  {
    quote: "I love the eco-friendly packaging options. It's great to see a company that cares about the environment. Will continue to shop here.",
    author: "- Emily R.",
    rating: "★★★★★"
  }
];

const AboutPage = () => {
  return (
    <>
      <Meta title="About Us | MegaBasket" description="MegaBasket is your one-stop shop for groceries, fashion, electronics, and more. Fast delivery, easy returns, and secure checkout. Discover our story." />
      
      <div className="about-page">
        {/* Hero Section */}
        <header className="about-hero">
          <div className="about-hero-content">
            <h1>Welcome to MegaBasket – Your Everyday Shopping Partner</h1>
            <p>Discover a world of convenience with our wide selection of products, delivered right to your door.</p>
          </div>
        </header>

        <div className="container">
          {/* What We Offer Section */}
          <section className="about-section what-we-offer-section">
            <h2 className="section-title">What We Offer</h2>
            <div className="offer-grid">
              <div className="offer-card">
                <FaTags size={40} className="offer-icon" />
                <h3>Wide Range of Products</h3>
                <p>From fresh groceries and electronics to the latest fashion and home essentials, we have it all.</p>
              </div>
              <div className="offer-card">
                <FaShippingFast size={40} className="offer-icon" />
                <h3>Fast & Reliable Delivery</h3>
                <p>Get your orders delivered to your doorstep with our lightning-fast same-day and next-day delivery services.</p>
              </div>
              <div className="offer-card">
                <FaShieldAlt size={40} className="offer-icon" />
                <h3>Easy Returns & Secure Payments</h3>
                <p>Shop with confidence thanks to our hassle-free return policy and 100% secure payment gateway.</p>
              </div>
              <div className="offer-card">
                <FaRecycle size={40} className="offer-icon" />
                <h3>Eco-Friendly Choices</h3>
                <p>We are committed to sustainability through eco-friendly packaging and supporting local producers.</p>
              </div>
            </div>
          </section>
        </div>

          {/* Customer Testimonials Section */}
          <section className="about-section testimonials-section">
            <div className="container">
              <h2 className="section-title">What Our Customers Say</h2>
              <div className="testimonial-carousel-container">
                <div className="testimonial-grid">
                  {[...testimonials, ...testimonials].map((testimonial, index) => (
                    <div className="testimonial-card" key={index}>
                      <p className="testimonial-quote">"{testimonial.quote}"</p>
                      <div className="testimonial-author">
                        <h4>{testimonial.author}</h4>
                        <div className="rating">{testimonial.rating}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

        <div className="container">
          {/* Meet Our Team Section */}
          <section className="about-section team-section">
            <h2 className="section-title">Meet Our Team</h2>
            
            {/* Founder Section */}
            <div className="founder-section">
              <div className="founder-card">
                <img src="../about/saurabh.jpg" alt="Saurabh Kumar, Founder & CEO" className="founder-photo" />
                <div className="founder-info">
                  <h3>Saurabh Kumar</h3>
                  <h4>Founder & CEO</h4>
                  <p className="founder-message">
                    "When we started MegaBasket, our goal was simple: to create an online shopping experience that we, as customers, would love. We envisioned a platform that wasn't just a marketplace, but a trusted partner in people's daily lives. We focused on three core principles: unparalleled convenience, a diverse and high-quality selection, and a genuine commitment to our customers. Every feature we build, every product we list, and every partnership we form is guided by the desire to make your life easier and more enjoyable. Thank you for being a part of our journey. We are excited to continue growing with you and for you."
                  </p>
                </div>
              </div>
            </div>

            {/* Other Team Members */}
            <div className="team-grid">
              <div className="team-member">
                <img src="../about/image.png" alt="Team Member 2" />
                <h4>John Smith</h4>
                <p>Chief Technology Officer</p>
              </div>
              <div className="team-member">
                <img src="../about/image.png" alt="Team Member 3" />
                <h4>Emily Jones</h4>
                <p>Head of Marketing</p>
              </div>
              <div className="team-member">
                <img src="../about/image.png" alt="Team Member 4" />
                <h4>Michael Brown</h4>
                <p>Operations Manager</p>
              </div>
            </div>
          </section>
        </div>

        <div className="container">
          <section className="about-section cta-section">
            <h2>Ready to Explore?</h2>
            <p>Discover thousands of products waiting for you.</p>
            <Link to="/" className="auth-button">Continue Shopping</Link>
          </section>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
