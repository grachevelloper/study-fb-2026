import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav
      style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        marginBottom: '2rem',
      }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to='/' style={{ textDecoration: 'none', color: '#007bff' }}>
            Главная
          </Link>
          <Link
            to='/products'
            style={{ textDecoration: 'none', color: '#007bff' }}>
            Продукты
          </Link>
        </div>

        <div>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span>Добрый день, {user?.first_name}!</span>
              <Link
                to='/create-product'
                style={{ textDecoration: 'none', color: '#28a745' }}>
                Создать продукт
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}>
                Выход
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link
                to='/login'
                style={{ textDecoration: 'none', color: '#007bff' }}>
                Вход
              </Link>
              <Link
                to='/register'
                style={{ textDecoration: 'none', color: '#007bff' }}>
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
