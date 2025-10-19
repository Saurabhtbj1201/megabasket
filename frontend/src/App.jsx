import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SearchPage from './pages/SearchPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import CategoryPage from './pages/CategoryPage';
import AdminContactPage from './pages/admin/AdminContactPage';
import ReturnPolicyPage from './pages/ReturnPolicyPage';
import CancellationPolicyPage from './pages/CancellationPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import AllCategoriesPage from './pages/AllCategoriesPage';
import TopOffersPage from './pages/TopOffersPage';
import axios from 'axios';
import NotFound from './pages/NotFound';

// Set axios base URL from env variable (works for both dev and prod)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/';

// Placeholders for new pages
const PlaceholderPage = ({ title }) => <div className="container" style={{padding: '2rem 0'}}><h1>{title}</h1><p>Content for this page will be added soon.</p></div>;

// Layouts and Route Protection
import RootLayout from './layouts/RootLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminRoute from './components/AdminRoute';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOffersPage from './pages/admin/AdminOffersPage';
import AdminProductPage from './pages/admin/AdminProductPage';
import AdminCategoryPage from './pages/admin/AdminCategoryPage';
import AdminOrderPage from './pages/admin/AdminOrderPage';
import AdminUserPage from './pages/admin/AdminUserPage';
import AdminBannerPage from './pages/admin/AdminBannerPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminSubCategoryPage from './pages/admin/AdminSubCategoryPage';
import AdminPromotionalMailPage from './pages/admin/AdminPromotionalMailPage';

function App() {
  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <Routes>
        {/* Public and User Routes with Main Header/Footer */}
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/:id" element={<OrderSuccessPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/products/offers" element={<TopOffersPage />} />
          <Route path="/all-categories" element={<AllCategoriesPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/offers" element={<AdminOffersPage />} />
            <Route path="/admin/products" element={<AdminProductPage />} />
            <Route path="/admin/categories" element={<AdminCategoryPage />} />
            <Route path="/admin/subcategories" element={<AdminSubCategoryPage />} />
            <Route path="/admin/orders" element={<AdminOrderPage />} />
            <Route path="/admin/users" element={<AdminUserPage />} />
            <Route path="/admin/banners" element={<AdminBannerPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
            <Route path="/admin/contact" element={<AdminContactPage />} />
            <Route path="/admin/promotional-mail" element={<AdminPromotionalMailPage />} />
          </Route>
        </Route>

        {/* 404 Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
