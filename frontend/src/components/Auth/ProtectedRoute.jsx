import React from 'react';
import { Navigate } from 'react-router-dom';

// ProtectedRoute — checks that a valid token exists
export const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('cognivault_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// AdminRoute — checks token AND isAdmin flag
// An authenticated non-admin hitting /admin gets bounced to /dashboard
export const AdminRoute = ({ children }) => {
  const token = sessionStorage.getItem('cognivault_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(sessionStorage.getItem('cognivault_user') || '{}');
  if (!user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Keep default export as ProtectedRoute for backward compatibility
export default ProtectedRoute;
