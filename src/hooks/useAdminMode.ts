import { useState, useEffect } from 'react';

const ADMIN_KEY = 'EUROPLAST_ADMIN_2024';
const SESSION_KEY = 'europlast_admin_session';

export const useAdminMode = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    // Check for URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    
    // Check for existing session
    const existingSession = localStorage.getItem(SESSION_KEY);
    
    if (adminParam === 'true' || existingSession) {
      setIsAdminMode(true);
      localStorage.setItem(SESSION_KEY, 'true');
    }
  }, []);

  const enterAdminMode = (key: string) => {
    if (key === ADMIN_KEY) {
      setIsAdminMode(true);
      localStorage.setItem(SESSION_KEY, 'true');
      setShowAdminLogin(false);
      return true;
    }
    return false;
  };

  const exitAdminMode = () => {
    setIsAdminMode(false);
    localStorage.removeItem(SESSION_KEY);
    // Remove admin param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
  };

  const toggleAdminLogin = () => {
    setShowAdminLogin(!showAdminLogin);
  };

  return {
    isAdminMode,
    showAdminLogin,
    enterAdminMode,
    exitAdminMode,
    toggleAdminLogin
  };
};