import React, { createContext, useState, useContext, useCallback } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  
  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);
  
  // Improved version with better error handling and state management
  const withLoading = useCallback(async (asyncFunction) => {
    let result;
    setLoading(true);
    
    try {
      result = await asyncFunction();
      return result;
    } catch (error) {
      console.error("Error in withLoading:", error);
      throw error;
    } finally {
      // Use setTimeout to ensure UI has time to update and prevents immediate flashing
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  }, []);
  
  return (
    <LoadingContext.Provider value={{ loading, startLoading, stopLoading, withLoading }}>
      {loading && <LoadingSpinner fullPage={true} />}
      <div className={loading ? 'content-hidden' : ''}>
        {children}
      </div>
    </LoadingContext.Provider>
  );
};
