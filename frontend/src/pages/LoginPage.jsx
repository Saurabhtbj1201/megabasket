import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { toast } from 'react-toastify';
import PasswordField from '../components/PasswordField';
import '../styles/Auth.css';
import { useAuth } from '../context/AuthContext';
import Meta from '../components/Meta';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Function to get device information
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const browserInfo = (() => {
      if (userAgent.indexOf("Chrome") > -1) return "Chrome";
      else if (userAgent.indexOf("Safari") > -1) return "Safari";
      else if (userAgent.indexOf("Firefox") > -1) return "Firefox";
      else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "Internet Explorer";
      else if (userAgent.indexOf("Edge") > -1) return "Edge";
      else return "Unknown Browser";
    })();
    
    const osInfo = (() => {
      if (userAgent.indexOf("Win") > -1) return "Windows";
      else if (userAgent.indexOf("Mac") > -1) return "MacOS";
      else if (userAgent.indexOf("Linux") > -1) return "Linux";
      else if (userAgent.indexOf("Android") > -1) return "Android";
      else if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) return "iOS";
      else return "Unknown OS";
    })();
    
    return {
      deviceName: navigator.platform || "Unknown Device",
      browser: browserInfo,
      os: osInfo,
      location: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown Location"
    };
  };

  const handlePostLogin = async (userData) => {
    login(userData);
    toast.success('Login successful!');

    const productToAdd = localStorage.getItem('productToAdd');
    if (productToAdd) {
        try {
            const config = { headers: { Authorization: `Bearer ${userData.token}` } };
            await axios.post('/api/cart', { productId: productToAdd }, config);
            toast.success(`Item added to cart!`);
            localStorage.removeItem('productToAdd');
        } catch (error) {
            toast.error('Could not add item to cart after login.');
        }
    }
    navigate('/');
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const deviceInfo = getDeviceInfo();
      const { data } = await axios.post('/api/auth/login', { 
        email: email.toLowerCase(), 
        password,
        deviceInfo
      });
      handlePostLogin(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const googleSuccess = async (res) => {
    try {
      const deviceInfo = getDeviceInfo();
      const { data } = await axios.post('/api/auth/google', { 
        token: res.credential,
        deviceInfo
      });
      handlePostLogin(data);
    } catch (error) {
      toast.error('Google Sign-In was unsuccessful. Try again later.');
    }
  };

  const googleError = () => {
    toast.error('Google Sign-In was unsuccessful. Try again later.');
  };

  return (
    <>
      <Meta title="Login | MegaBasket" description="Log in to your MegaBasket account to access your cart, orders, and more." />
      <div className="auth-container">
        <form className="auth-form" onSubmit={submitHandler}>
          <h1>Login</h1>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="auth-button">
            Login
          </button>
          <div className="google-login-container">
            <GoogleLogin onSuccess={googleSuccess} onError={googleError} />
          </div>
          <div className="auth-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <p>
              New Customer? <Link to="/signup">Register</Link>
            </p>
            <p>
              <Link to="/admin/login">Login as Admin</Link>
            </p>
          </div>
        </form>
      </div>
    </>
  );
};

export default LoginPage;
