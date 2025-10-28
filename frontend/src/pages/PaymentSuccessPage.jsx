import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Meta from '../components/Meta';

const PaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Get all payment parameters from URL
                const paymentParams = {};
                searchParams.forEach((value, key) => {
                    paymentParams[key] = value;
                });

                console.log('Payment success params received:', paymentParams);

                // Check if we have required parameters
                if (!paymentParams.txnid || !paymentParams.status || !paymentParams.udf1) {
                    console.error('Missing required payment parameters:', {
                        txnid: paymentParams.txnid,
                        status: paymentParams.status,
                        udf1: paymentParams.udf1
                    });
                    toast.error('Invalid payment response. Redirecting to orders page...');
                    setTimeout(() => navigate('/profile?tab=orders'), 2000);
                    return;
                }

                // Check if payment status is success
                if (paymentParams.status !== 'success') {
                    console.log('Payment not successful, redirecting to failure page');
                    navigate(`/payment/failure?${searchParams.toString()}`);
                    return;
                }

                // Verify payment with backend
                console.log('Sending verification request to backend...');
                const response = await axios.post('/api/orders/verify-payment', paymentParams);
                
                console.log('Payment verification response:', response.data);
                
                if (response.data && response.data.success) {
                    toast.success('Payment successful! Order confirmed.');
                    // Navigate to order details page
                    navigate(`/order/${paymentParams.udf1}`);
                } else {
                    toast.error('Payment verification failed. Please contact support.');
                    navigate('/profile?tab=orders');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                if (error.response) {
                    console.error('Error response:', error.response.data);
                }
                toast.error('Payment verification failed. Please check your order status in My Orders.');
                navigate('/profile?tab=orders');
            } finally {
                setProcessing(false);
            }
        };

        // Add delay to ensure all URL parameters are captured
        const timer = setTimeout(verifyPayment, 1000);
        return () => clearTimeout(timer);
    }, [searchParams, navigate]);

    if (processing) {
        return (
            <>
                <Meta title="Verifying Payment | MegaBasket" />
                <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <h2>Verifying your payment...</h2>
                    <div className="spinner" style={{ margin: '2rem auto' }}></div>
                    <p>Please don't close this window or go back.</p>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
                        This may take a few moments...
                    </p>
                </div>
            </>
        );
    }

    return null;
};

export default PaymentSuccessPage;
