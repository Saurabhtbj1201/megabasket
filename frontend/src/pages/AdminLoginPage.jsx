import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import PasswordField from '../components/PasswordField';
import Meta from '../components/Meta';
import '../styles/Auth.css';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/admin/login', { email: email.toLowerCase(), password });
      localStorage.setItem('adminInfo', JSON.stringify(data));
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <>
      <Meta title="Admin Login | MegaBasket" noIndex={true} />
      <div className="admin-login-page">
        <header className="auth-header">
          <Link to="/" className="auth-header-logo">MegaBasket</Link>
        </header>
        <div className="auth-container">
          <form className="auth-form" onSubmit={submitHandler}>
            <h1>Admin Login</h1>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="auth-button">Login</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;
