import axios from 'axios';

/**
 * Fetch data with caching support
 * @param {string} url - API endpoint to fetch from
 * @param {string} cacheName - Unique name for the cache entry
 * @param {number} expiryTime - Cache expiry time in milliseconds (default: 1 hour)
 * @returns {Promise<any>} - The fetched or cached data
 */
export const fetchWithCache = async (url, cacheName, expiryTime = 300000) => {
  const cacheKey = `cache_${cacheName}`;
  
  // Check if data exists in cache and is not expired
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    if (Date.now() - timestamp < expiryTime) {
      console.log(`Using cached data for ${cacheName}`);
      return data;
    }
  }
  
  // If no cache or expired, fetch fresh data
  console.log(`Fetching fresh data for ${cacheName}`);
  const response = await axios.get(url);
  const data = response.data;
  
  // Store in cache with timestamp
  localStorage.setItem(
    cacheKey, 
    JSON.stringify({
      data,
      timestamp: Date.now()
    })
  );
  
  return data;
};

/**
 * Clear a specific cache entry
 * @param {string} cacheName - Name of cache to clear
 */
export const clearCache = (cacheName) => {
  localStorage.removeItem(`cache_${cacheName}`);
};

/**
 * Clear all cached data
 */
export const clearAllCache = () => {
  Object.keys(localStorage)
    .filter(key => key.startsWith('cache_'))
    .forEach(key => localStorage.removeItem(key));
};
