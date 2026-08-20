import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AuthContext — Memory-based auth token store.
 *
 * Token lives in React state (JavaScript heap), NOT in sessionStorage.
 * This eliminates XSS token theft via localStorage/sessionStorage.
 *
 * Non-sensitive display data (name, email, role, tier) stays in sessionStorage
 * so the UI can hydrate after a refresh without requiring a re-login.
 *
 * On page refresh: token is gone from memory → user must log in again.
 * This is the correct, secure SPA pattern (same as Auth0, Clerk, etc.).
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Token lives ONLY in memory — never written to any browser storage
  const [token, setToken] = useState(null);

  // Non-sensitive display data can be in sessionStorage for UX hydration
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('cognivault_user') || 'null');
    } catch {
      return null;
    }
  });

  const login = useCallback((newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    // Store only display data (non-secret) in session storage
    sessionStorage.setItem('cognivault_user', JSON.stringify(userData));
    // No token in sessionStorage — it lives only in memory
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('cognivault_user');
    sessionStorage.removeItem('cognivault_token'); // Clean up any old token from legacy code
  }, []);

  // Check if there's a legacy token in sessionStorage (for smooth migration)
  // Once the user logs in through the new flow, this path is not used
  useEffect(() => {
    const legacyToken = sessionStorage.getItem('cognivault_token');
    if (legacyToken && !token) {
      setToken(legacyToken);
    }
  }, []);

  const isAuthenticated = !!token;
  const isAdmin = user?.isAdmin === true;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for consuming auth context
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
