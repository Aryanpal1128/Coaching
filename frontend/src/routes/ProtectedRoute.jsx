import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (user && user.isOnboarded && location.pathname === '/onboarding') {
    if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to the correct dashboard based on role
    if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
