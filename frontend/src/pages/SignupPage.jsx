import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import PasswordField from '../components/PasswordField';
import '../styles/Auth.css';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import Meta from '../components/Meta';

const SignupPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await axios.post('/api/auth/register', { name: formData.name, email: formData.email.toLowerCase(), password: formData.password, phone: formData.phone });
      toast.info('OTP sent to your email!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/verify-otp', { email: formData.email.toLowerCase(), otp });
      login(data);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const googleSuccess = async (res) => {
    try {
      const { data } = await axios.post('/api/auth/google', { token: res.credential });
      login(data);
      toast.success('Sign-up successful!');
      navigate('/');
    } catch (error) {
      toast.error('Google Sign-Up was unsuccessful. Try again later.');
    }
  };

  const googleError = () => {
    toast.error('Google Sign-Up was unsuccessful. Try again later.');
  };

  return (
    <>
      <Meta title="Sign Up | MegaBasket" description="Create your MegaBasket account to start shopping for the best deals online." />
      <div className="auth-container">
        {step === 1 ? (
          <form className="auth-form" onSubmit={handleSignupSubmit}>
            <h1>Sign Up</h1>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" value={formData.email} onChange={handleInputChange} required />
            </div>
             <div className="form-group">
              <label htmlFor="phone">Phone Number (Optional)</label>
              <input type="tel" id="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <PasswordField id="password" value={formData.password} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <PasswordField id="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
            </div>
            <button type="submit" className="auth-button">Register</button>
            <div style={{ textAlign: 'center', margin: '1rem 0', color: '#666' }}>OR</div>
            <div className="google-login-container">
              <GoogleLogin onSuccess={googleSuccess} onError={googleError} />
            </div>
            <div className="auth-links"><p>Have an account? <Link to="/login">Login</Link></p></div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleOtpSubmit}>
            <h1>Verify OTP</h1>
            <p>An OTP has been sent to {formData.email}</p>
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <button type="submit" className="auth-button">Verify</button>
          </form>
        )}
      </div>
    </>
  );
};

export default SignupPage;
