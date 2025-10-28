import React, { useState } from 'react';
import { FiCreditCard, FiLock } from 'react-icons/fi';
import './PaymentForm.css';

const PaymentForm = ({ onSubmit, isProcessing, paymentMethod }) => {
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: ''
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        // Format card number with spaces
        if (name === 'cardNumber') {
            formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
            if (formattedValue.length > 19) formattedValue = formattedValue.substring(0, 19);
        }
        
        // Limit CVV to 3-4 digits
        if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').substring(0, 4);
        }

        // Format expiry month/year
        if (name === 'expiryMonth' || name === 'expiryYear') {
            formattedValue = value.replace(/\D/g, '');
            if (name === 'expiryMonth' && formattedValue.length > 2) {
                formattedValue = formattedValue.substring(0, 2);
            }
            if (name === 'expiryYear' && formattedValue.length > 4) {
                formattedValue = formattedValue.substring(0, 4);
            }
        }

        setCardDetails(prev => ({
            ...prev,
            [name]: formattedValue
        }));

        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
            newErrors.cardNumber = 'Please enter a valid 16-digit card number';
        }

        if (!cardDetails.expiryMonth || cardDetails.expiryMonth < 1 || cardDetails.expiryMonth > 12) {
            newErrors.expiryMonth = 'Please enter a valid month (01-12)';
        }

        if (!cardDetails.expiryYear || cardDetails.expiryYear.length !== 4) {
            newErrors.expiryYear = 'Please enter a valid 4-digit year';
        }

        if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
            newErrors.cvv = 'Please enter a valid CVV';
        }

        if (!cardDetails.cardholderName.trim()) {
            newErrors.cardholderName = 'Please enter cardholder name';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit({
                cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
                expiryMonth: cardDetails.expiryMonth.padStart(2, '0'),
                expiryYear: cardDetails.expiryYear,
                cvv: cardDetails.cvv,
                cardholderName: cardDetails.cardholderName
            });
        }
    };

    if (paymentMethod === 'COD') {
        return null;
    }

    return (
        <form onSubmit={handleSubmit} className="payment-form">
            <div className="payment-form-header">
                <FiCreditCard size={24} />
                <h3>Card Details</h3>
                <FiLock size={16} color="#28a745" />
            </div>

            <div className="form-group">
                <label htmlFor="cardNumber">Card Number</label>
                <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    className={errors.cardNumber ? 'error' : ''}
                />
                {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
            </div>

            <div className="form-group">
                <label htmlFor="cardholderName">Cardholder Name</label>
                <input
                    type="text"
                    id="cardholderName"
                    name="cardholderName"
                    value={cardDetails.cardholderName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={errors.cardholderName ? 'error' : ''}
                />
                {errors.cardholderName && <span className="error-text">{errors.cardholderName}</span>}
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="expiryMonth">Expiry Month</label>
                    <input
                        type="text"
                        id="expiryMonth"
                        name="expiryMonth"
                        value={cardDetails.expiryMonth}
                        onChange={handleInputChange}
                        placeholder="MM"
                        className={errors.expiryMonth ? 'error' : ''}
                    />
                    {errors.expiryMonth && <span className="error-text">{errors.expiryMonth}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="expiryYear">Expiry Year</label>
                    <input
                        type="text"
                        id="expiryYear"
                        name="expiryYear"
                        value={cardDetails.expiryYear}
                        onChange={handleInputChange}
                        placeholder="YYYY"
                        className={errors.expiryYear ? 'error' : ''}
                    />
                    {errors.expiryYear && <span className="error-text">{errors.expiryYear}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="cvv">CVV</label>
                    <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        className={errors.cvv ? 'error' : ''}
                    />
                    {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                </div>
            </div>

            <button 
                type="submit" 
                className="auth-button payment-btn"
                disabled={isProcessing}
            >
                <FiLock />
                {isProcessing ? (
                    <>
                        <span className="spinner"></span>
                        Processing Payment...
                    </>
                ) : (
                    'Pay Securely'
                )}
            </button>
        </form>
    );
};

export default PaymentForm;
