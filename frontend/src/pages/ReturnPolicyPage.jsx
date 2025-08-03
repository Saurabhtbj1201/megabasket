import React from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/Meta';
import './PolicyPage.css';

const ReturnPolicyPage = () => {
  return (
    <>
      <Meta title="Return & Refund Policy | MegaBasket" description="Read our Return & Refund Policy. Learn about return eligibility, non-returnable items, and the refund process at MegaBasket." />
      <div className="policy-page">
        <div className="container">
          <header className="policy-header">
            <h1>Return & Refund Policy</h1>
            <p>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </header>
          <div className="policy-content">
            <p>Your satisfaction is our priority. If you are not completely satisfied with your purchase, we are here to help. This policy details the process, conditions, and timelines for returns and refunds.</p>

            <h2>Return Eligibility & Window</h2>
            <p>Most items are eligible for return within a specific window from the date of delivery.</p>
            <ul>
              <li><strong>Electronics & Appliances:</strong> 7 days</li>
              <li><strong>Fashion & Apparel:</strong> 10 days</li>
              <li><strong>Home & Kitchen:</strong> 7 days</li>
              <li><strong>Groceries & Perishables:</strong> Not eligible for return unless the item is damaged, defective, or incorrect upon delivery.</li>
            </ul>

            <h3>Conditions for a Valid Return</h3>
            <p>To be eligible for a return, the item must meet the following conditions:</p>
            <ul>
              <li>It must be unused, unworn, unwashed, and free of any defects.</li>
              <li>It must be in its original, undamaged packaging with all original tags, user manuals, warranty cards, and accessories included.</li>
              <li>The manufacturer's seal on the product or packaging must not be broken (if applicable).</li>
            </ul>

            <h2>Non-Returnable Items</h2>
            <p>For health, safety, and hygiene reasons, the following items are not eligible for return:</p>
            <ul>
              <li>Perishable goods (e.g., fresh fruits, vegetables, dairy products).</li>
              <li>Personal care items, innerwear, lingerie, and swimwear.</li>
              <li>Products that have been used, installed, or have had their seals broken.</li>
              <li>Digital products, gift cards, and software.</li>
            </ul>

            <h2>How to Initiate a Return</h2>
            <ol>
              <li>Log in to your MegaBasket account and go to the <strong>"My Orders"</strong> page.</li>
              <li>Select the order containing the item you wish to return.</li>
              <li>Click on the <strong>"Return Item"</strong> button next to the product.</li>
              <li>Select the reason for the return from the dropdown menu and provide any additional comments.</li>
              <li>Follow the on-screen instructions to confirm your return request and schedule a pickup.</li>
            </ol>

            <h2>Refund Process</h2>
            <p>Once we receive your returned item and it passes our quality inspection, we will process your refund.</p>
            <ul>
              <li><strong>Refund Method:</strong> For prepaid orders, the refund will be credited to the original payment source. For Cash on Delivery (COD) orders, the refund will be processed via bank transfer or as store credit, based on your preference.</li>
              <li><strong>Timeline:</strong> The entire refund process, from pickup to credit, typically takes 7-10 business days.</li>
              <li><strong>Deductions:</strong> Shipping and handling charges are non-refundable unless the return is due to an error on our part (e.g., damaged or incorrect item).</li>
            </ul>

            <h2>Damaged, Defective, or Incorrect Items</h2>
            <p>If you receive an item that is damaged, defective, or not what you ordered, please contact our <Link to="/contact">Customer Support</Link> within 48 hours of delivery. Please provide your order ID and photos of the item and packaging. We will arrange for a prompt replacement or a full refund at no extra cost to you.</p>
          </div>
          <div className="policy-footer-cta">
            <Link to="/" className="auth-button">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReturnPolicyPage;
