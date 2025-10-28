import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiAlertCircle } from 'react-icons/fi';
import Meta from '../components/Meta';
import axios from 'axios';

const PaymentFailurePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [processing, setProcessing] = useState(true);
    const [orderCancelled, setOrderCancelled] = useState(false);

    useEffect(() => {
        const handleFailedPayment = async () => {
            try {
                // Get payment parameters from URL
                const paymentParams = {};
                searchParams.forEach((value, key) => {
                    paymentParams[key] = value;
                });

                console.log('Payment failure params:', paymentParams);

                // Verify the failed payment with backend to update order status
                if (paymentParams.txnid && paymentParams.udf1) {
                    const response = await axios.post('/api/orders/verify-payment', paymentParams);
                    
                    if (response.data && !response.data.success) {
                        setOrderCancelled(true);
                        toast.error('Payment failed. Your order has been cancelled.');
                    }
                } else {
                    toast.error('Payment was unsuccessful. Please try again.');
                }
            } catch (error) {
                console.error('Error handling payment failure:', error);
                toast.error('Payment failed. Please try again.');
            } finally {
                setProcessing(false);
            }
        };

        handleFailedPayment();
    }, [searchParams]);

    if (processing) {
        return (
            <>
                <Meta title="Processing | MegaBasket" />
                <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <h2>Processing payment result...</h2>
                    <div className="spinner" style={{ margin: '2rem auto' }}></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Meta title="Payment Failed | MegaBasket" />
            <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                <FiAlertCircle size={80} color="var(--danger-color)" style={{ margin: '2rem 0' }} />
                <h1>Payment Failed</h1>
                <p>We're sorry, but your payment could not be processed.</p>
                {orderCancelled ? (
                    <p>Your order has been cancelled and no amount has been charged to your account.</p>
                ) : (
                    <p>Please try placing the order again with a different payment method.</p>
                )}
                
                <div style={{ marginTop: '2rem' }}>
                    <Link to="/cart" className="auth-button" style={{ marginRight: '1rem' }}>
                        Return to Cart
                    </Link>
                    <Link to="/" className="auth-button secondary">
                        Continue Shopping
                    </Link>
                </div>
                
                <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
                    <p>Need help? <Link to="/contact" style={{ color: 'var(--primary-color)' }}>Contact our support team</Link></p>
                </div>
            </div>
        </>
    );
};

export default PaymentFailurePage;
