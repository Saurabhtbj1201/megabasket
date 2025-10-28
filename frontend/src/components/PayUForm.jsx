import React, { useRef, useEffect } from 'react';

const PayUForm = ({ paymentData, paymentUrl }) => {
    const formRef = useRef(null);

    useEffect(() => {
        if (paymentData && formRef.current && paymentUrl) {
            console.log('Submitting payment form with data:', {
                key: paymentData.key,
                txnid: paymentData.txnid,
                amount: paymentData.amount,
                productinfo: paymentData.productinfo,
                firstname: paymentData.firstname,
                email: paymentData.email,
                surl: paymentData.surl,
                furl: paymentData.furl,
                curl: paymentData.curl,
                udf1: paymentData.udf1,
                hash: paymentData.hash ? paymentData.hash.substring(0, 20) + '...' : 'No hash'
            });
            
            // Submit form with a slight delay to ensure DOM is ready
            const timer = setTimeout(() => {
                if (formRef.current) {
                    console.log('Submitting form to:', paymentUrl);
                    formRef.current.submit();
                }
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [paymentData, paymentUrl]);

    if (!paymentData || !paymentUrl) return null;

    return (
        <div>
            <form
                ref={formRef}
                action={paymentUrl}
                method="POST"
                acceptCharset="UTF-8"
                style={{ display: 'none' }}
            >
                <input type="hidden" name="key" value={paymentData.key || ''} />
                <input type="hidden" name="txnid" value={paymentData.txnid || ''} />
                <input type="hidden" name="amount" value={paymentData.amount || ''} />
                <input type="hidden" name="productinfo" value={paymentData.productinfo || ''} />
                <input type="hidden" name="firstname" value={paymentData.firstname || ''} />
                <input type="hidden" name="lastname" value={paymentData.lastname || ''} />
                <input type="hidden" name="email" value={paymentData.email || ''} />
                <input type="hidden" name="phone" value={paymentData.phone || ''} />
                <input type="hidden" name="address1" value={paymentData.address1 || ''} />
                <input type="hidden" name="address2" value={paymentData.address2 || ''} />
                <input type="hidden" name="city" value={paymentData.city || ''} />
                <input type="hidden" name="state" value={paymentData.state || ''} />
                <input type="hidden" name="country" value={paymentData.country || ''} />
                <input type="hidden" name="zipcode" value={paymentData.zipcode || ''} />
                <input type="hidden" name="surl" value={paymentData.surl || ''} />
                <input type="hidden" name="furl" value={paymentData.furl || ''} />
                <input type="hidden" name="curl" value={paymentData.curl || ''} />
                <input type="hidden" name="service_provider" value={paymentData.service_provider || ''} />
                <input type="hidden" name="hash" value={paymentData.hash || ''} />
                <input type="hidden" name="udf1" value={paymentData.udf1 || ''} />
                <input type="hidden" name="udf2" value={paymentData.udf2 || ''} />
                <input type="hidden" name="udf3" value={paymentData.udf3 || ''} />
                <input type="hidden" name="udf4" value={paymentData.udf4 || ''} />
                <input type="hidden" name="udf5" value={paymentData.udf5 || ''} />
                
                {/* Manual submit button for debugging */}
                <button type="submit" style={{ display: 'none' }}>Submit Payment</button>
            </form>
            
            {/* Show loading message */}
            <div style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                backgroundColor: 'rgba(255,255,255,0.95)', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                zIndex: 9999 
            }}>
                <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                    <h3>Redirecting to PayU Payment Gateway...</h3>
                    <p>Please wait while we process your request...</p>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
                        Transaction ID: {paymentData.txnid}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#999' }}>
                        If you're not redirected automatically, please refresh the page or contact support.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PayUForm;
