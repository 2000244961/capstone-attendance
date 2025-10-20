import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../../shared/UserContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user } = useUser();

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required and user doesn't have it, redirect to login
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // If all checks pass, render the children components
  return children;
};

export default ProtectedRoute;
