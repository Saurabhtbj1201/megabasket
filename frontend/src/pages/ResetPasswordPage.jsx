import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import PasswordField from '../components/PasswordField';
import Meta from '../components/Meta';
import '../styles/Auth.css';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      const { data } = await axios.put(`/api/auth/reset-password/${token}`, { password });
      toast.success(data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <>
      <Meta title="Reset Password | MegaBasket" noIndex={true} />
      <div className="auth-container">
        <form className="auth-form" onSubmit={submitHandler}>
          <h1>Reset Password</h1>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <PasswordField id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <PasswordField id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="auth-button">Reset Password</button>
        </form>
      </div>
    </>
  );
};

export default ResetPasswordPage;
