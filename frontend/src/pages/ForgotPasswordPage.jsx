import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Meta from '../components/Meta';
import '../styles/Auth.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { email: email.toLowerCase() });
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <>
      <Meta title="Forgot Password | MegaBasket" noIndex={true} />
      <div className="auth-container">
        <form className="auth-form" onSubmit={submitHandler}>
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a password reset link.</p>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="auth-button">Send Reset Link</button>
        </form>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
