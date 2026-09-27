import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SessionTimeoutModal from './SessionTimeoutModal';

const AdminSessionManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds warning
  const navigate = useNavigate();
  const location = useLocation();
  
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  
  // 5 minutes of inactivity before warning
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; 
  // 60 seconds of warning before logout
  const WARNING_TIMEOUT = 60; 

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setShowModal(false);
    navigate('/login');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setShowModal(false);
    setTimeLeft(WARNING_TIMEOUT);
    
    timeoutRef.current = setTimeout(() => {
      setShowModal(true);
      
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    }, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/login';
    const hasToken = !!localStorage.getItem('adminToken');
    
    if (isAdminRoute && hasToken) {
      resetTimer();
      
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
      const activityHandler = () => {
        // Only reset if modal is NOT showing. If modal is showing, they MUST click "Stay Logged In"
        if (!showModal) {
          resetTimer();
        }
      };

      events.forEach(event => document.addEventListener(event, activityHandler));
      
      return () => {
        events.forEach(event => document.removeEventListener(event, activityHandler));
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      // Clean up if not on an admin route
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setShowModal(false);
    }
  }, [location.pathname, showModal, resetTimer]);

  const handleStayLoggedIn = () => {
    // Optionally call an endpoint to refresh token here if we had refresh tokens
    resetTimer();
  };

  return (
    <SessionTimeoutModal
      isOpen={showModal}
      timeLeft={timeLeft}
      onLogout={handleLogout}
      onStayLoggedIn={handleStayLoggedIn}
    />
  );
};

export default AdminSessionManager;
