import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  // If no user is logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  // If a specific role is required and user doesn't have it, redirect to login
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  // If all checks pass, render the children components
  return children;
};

export default ProtectedRoute;
