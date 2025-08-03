import React from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/Meta';
import './PolicyPage.css';

const CancellationPolicyPage = () => {
  return (
    <>
      <Meta title="Order Cancellation Policy | MegaBasket" description="Understand the order cancellation policy at MegaBasket. Learn how to cancel an order and the conditions for cancellation." />
      <div className="policy-page">
        <div className="container">
          <header className="policy-header">
            <h1>Order Cancellation Policy</h1>
            <p>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </header>
          <div className="policy-content">
            <p>At MegaBasket, we strive to provide a flexible shopping experience. We understand that sometimes you may need to cancel an order. This policy outlines the conditions and process for doing so.</p>

            <h2>Cancellation Window</h2>
            <p>You can cancel an order free of charge as long as it has not been dispatched from our warehouse. The option to cancel will be available in your account under the "My Orders" section.</p>
            <ul>
              <li><strong>Before Dispatch:</strong> Most orders can be cancelled within a few hours of being placed. The exact window depends on the product category and the time of day the order was placed.</li>
              <li><strong>After Dispatch:</strong> Once an order's status changes to "Processing," "Shipped," or "In Transit," it can no longer be cancelled. In such cases, you may be able to return the item once it is delivered, subject to our <Link to="/return-policy">Return & Refund Policy</Link>.</li>
            </ul>

            <h2>How to Cancel an Order</h2>
            <p>Follow these simple steps to cancel your order:</p>
            <ol>
              <li>Log in to your MegaBasket account.</li>
              <li>Navigate to the <strong>"My Orders"</strong> page from your account dashboard.</li>
              <li>Find the order you wish to cancel.</li>
              <li>If the <strong>"Cancel Order"</strong> button is visible and clickable, it means your order is eligible for cancellation.</li>
              <li>Click the button and follow the on-screen prompts to confirm the cancellation.</li>
            </ol>
            <p>If the "Cancel Order" button is not visible, it means the order has passed the cancellation window and is already being prepared for dispatch.</p>

            <h2>Refunds for Cancelled Orders</h2>
            <ul>
              <li><strong>Prepaid Orders:</strong> If you paid for your order online (Credit/Debit Card, Net Banking, UPI), a refund will be initiated automatically upon successful cancellation. The amount will be credited back to your original payment method within 5-7 business days, depending on your bank's processing time.</li>
              <li><strong>Cash on Delivery (COD) Orders:</strong> If you selected COD, no payment was made, so no refund is applicable. The order will simply be cancelled.</li>
            </ul>

            <h2>Exceptions</h2>
            <p>Please note that some items may not be eligible for cancellation once the order is placed. These include:</p>
            <ul>
              <li>Personalized or custom-made products.</li>
              <li>Digital products or gift cards that have been delivered electronically.</li>
              <li>Items specifically marked as "non-cancellable" on the product page.</li>
            </ul>

            <h2>Contact Us</h2>
            <p>If you encounter any issues while trying to cancel an order or have any questions about this policy, please do not hesitate to <Link to="/contact">contact our Customer Support team</Link> for assistance.</p>
          </div>
          <div className="policy-footer-cta">
            <Link to="/" className="auth-button">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CancellationPolicyPage;
