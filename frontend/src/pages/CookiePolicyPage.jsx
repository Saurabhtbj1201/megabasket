import React from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/Meta';
import './PolicyPage.css';

const CookiePolicyPage = () => {
  return (
    <>
      <Meta title="Cookie Policy | MegaBasket" description="Learn about how MegaBasket uses cookies to improve your shopping experience and how you can manage them." />
      <div className="policy-page">
        <div className="container">
          <header className="policy-header">
            <h1>Cookie Policy</h1>
            <p>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </header>
          <div className="policy-content">
            <p>This Cookie Policy explains what cookies are, how MegaBasket ("we," "our," or "us") uses them on our website, and your choices regarding cookies.</p>

            <h2>1. What Are Cookies?</h2>
            <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>

            <h2>2. How We Use Cookies</h2>
            <p>We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry-standard options for disabling cookies without completely disabling the functionality and features they add to this site. It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are used to provide a service that you use.</p>
            <p>We use cookies to:</p>
            <ul>
              <li><strong>Remember Your Preferences:</strong> To remember information about you, such as your login status and shopping cart contents.</li>
              <li><strong>Improve Our Service:</strong> To understand how you use our site, which helps us to improve performance and user experience.</li>
              <li><strong>Analytics:</strong> To track site traffic and user interaction, allowing us to make data-driven improvements. We use services like Google Analytics for this purpose.</li>
              <li><strong>Marketing:</strong> To deliver relevant advertisements to you and measure the effectiveness of our marketing campaigns.</li>
            </ul>

            <h2>3. Types of Cookies We Use</h2>
            <ul>
              <li><strong>Essential Cookies:</strong> These are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas. Without these cookies, services you have asked for, like shopping carts and secure checkout, cannot be provided.</li>
              <li><strong>Performance and Functionality Cookies:</strong> These cookies are used to enhance the performance and functionality of our website but are non-essential to its use. However, without these cookies, certain functionality (like remembering your login details) may become unavailable.</li>
              <li><strong>Analytics and Customization Cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website for you.</li>
              <li><strong>Targeting Cookies:</strong> These cookies record your visit to our website, the pages you have visited, and the links you have followed. We will use this information to make our website and the advertising displayed on it more relevant to your interests.</li>
            </ul>

            <h2>4. Your Choices Regarding Cookies</h2>
            <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by setting or amending your web browser controls. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.</p>
            <p>Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">www.aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.</p>

            <h2>5. Changes to This Cookie Policy</h2>
            <p>We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.</p>
          </div>
          <div className="policy-footer-cta">
            <Link to="/" className="auth-button">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookiePolicyPage;
