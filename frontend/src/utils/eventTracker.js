import axios from 'axios';

// Generate or get session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Track event
export const trackEvent = async (eventType, data = {}) => {
  try {
    const sessionId = getSessionId();
    const token = localStorage.getItem('userInfo') 
      ? JSON.parse(localStorage.getItem('userInfo')).token 
      : null;

    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    await axios.post('/api/events', {
      eventType,
      sessionId,
      ...data
    }, config);
  } catch (error) {
    console.error('Event tracking failed:', error);
  }
};

// Specific tracking functions
export const trackProductView = (productId, context = {}) => {
  return trackEvent('view', {
    productId,
    context: {
      page: 'product',
      ...context
    }
  });
};

export const trackAddToCart = (productId, price, quantity = 1) => {
  return trackEvent('add_to_cart', {
    productId,
    price,
    quantity,
    context: { page: window.location.pathname }
  });
};

export const trackPurchase = (productId, price, quantity) => {
  return trackEvent('purchase', {
    productId,
    price,
    quantity
  });
};

export const trackSearch = (query, resultCount) => {
  return trackEvent('search', {
    context: {
      query,
      page: 'search',
      resultCount
    }
  });
};

export const trackWishlist = (productId) => {
  return trackEvent('wishlist', {
    productId
  });
};

export const trackRemoveFromCart = (productId) => {
  return trackEvent('remove_from_cart', {
    productId
  });
};
