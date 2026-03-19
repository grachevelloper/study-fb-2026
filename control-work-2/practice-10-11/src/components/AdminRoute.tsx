import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>Загрузка...</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' />;
  }

  if (!isAdmin) {
    return <Navigate to='/products' />;
  }

  return <>{children}</>;
};

export default AdminRoute;
