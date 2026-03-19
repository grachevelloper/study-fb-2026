import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireSeller?: boolean;
  requireAdmin?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requireSeller = false,
  requireAdmin = false,
}) => {
  const { isAuthenticated, loading, isSeller, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>Загрузка...</div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to='/products' />;
  }

  if (requireSeller && !isSeller) {
    return <Navigate to='/products' />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
