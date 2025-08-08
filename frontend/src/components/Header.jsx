import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiSearch, FiBell, FiMapPin, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import LocationModal from './LocationModal';
import NotificationDropdown from './NotificationDropdown';
import { toast } from 'react-toastify';
import './Header.css';

const Header = () => {
  const { userInfo, logout, cartCount, notifications } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('Select Location');
  const [searchTerm, setSearchTerm] = useState('');
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const playedNotificationIds = useRef(new Set());

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef, notificationRef]);

  useEffect(() => {
    const savedAddress = localStorage.getItem('currentAddress');
    if (savedAddress && userInfo) {
      const addr = JSON.parse(savedAddress);
      setCurrentAddress(`${addr.city}, ${addr.state}`);
    } else {
      setCurrentAddress('Select Location');
    }
  }, [userInfo]);

  const handleLocationClick = () => {
    if (!userInfo) {
      return toast.info('Please log in to select or save a location.');
    }
    setIsModalOpen(true);
  };

  const handleSelectAddress = (address) => {
    localStorage.setItem('currentAddress', JSON.stringify(address));
    setCurrentAddress(`${address.city}, ${address.state}`);
    setIsModalOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
        navigate(`/search?q=${searchTerm}`);
    }
  };

  return (
    <>
      <header className="header">
        <Link to="/" className="header-logo">
          MegaBasket
        </Link>
        
        <form className="header-search" onSubmit={handleSearchSubmit}>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" style={{background: 'none', border: 'none', cursor: 'pointer', display: 'flex'}}><FiSearch /></button>
        </form>

        <nav className="header-nav">
          <Link to="/cart" className="nav-icon-link">
            <FiShoppingCart />
            {userInfo && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <div className="nav-icon-link" ref={notificationRef}>
            <button onClick={() => setNotificationOpen(!notificationOpen)} style={{background: 'none', border: 'none', cursor: 'pointer', display: 'flex', fontSize: '1.2rem'}}>
              <FiBell />
              {userInfo && unreadCount > 0 && <span className="cart-badge">{unreadCount}</span>}
            </button>
            {notificationOpen && <NotificationDropdown onClose={() => setNotificationOpen(false)} />}
          </div>
          {userInfo ? (
            <div className="profile-menu" ref={profileMenuRef}>
              <button className="profile-menu-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
                {userInfo.profilePicture ? (
                  <img key={userInfo.profilePicture} src={userInfo.profilePicture} alt={userInfo.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                ) : (
                  <FiUser />
                )}
                <span className="profile-name">{userInfo.name.split(' ')[0]}</span>
              </button>
              {dropdownOpen && (
                <ul className="profile-dropdown">
                  <li><Link to="/profile" onClick={() => setDropdownOpen(false)}>Profile</Link></li>
                  <li><Link to="/profile?tab=orders" onClick={() => setDropdownOpen(false)}>Orders</Link></li>
                  <li><Link to="/profile?tab=activity" onClick={() => setDropdownOpen(false)}>My Activity</Link></li>
                  <li><button onClick={() => { logout(); setDropdownOpen(false); }}>Logout</button></li>
                </ul>
              )}
            </div>
          ) : (
            <Link to="/login">
              <span className="desktop-login-text">Login/Signup</span>
              <FiUser className="mobile-login-icon" />
            </Link>
          )}
        </nav>
      </header>
      {userInfo && (
        <div className="location-bar" onClick={handleLocationClick}>
          <FiMapPin /> {currentAddress}
        </div>
      )}
      <LocationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAddress={handleSelectAddress}
      />
    </>
  );
};

export default Header;
