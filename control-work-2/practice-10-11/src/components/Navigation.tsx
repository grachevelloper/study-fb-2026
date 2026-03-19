import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
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
            Домашняя
          </Link>
          <Link
            to='/products'
            style={{ textDecoration: 'none', color: '#007bff' }}>
            Продукты
          </Link>
          {isAdmin && (
            <Link
              to='/users'
              style={{ textDecoration: 'none', color: '#007bff' }}>
              Пользователи
            </Link>
          )}
        </div>

        <div>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span>
                Добрый день, {user?.first_name}!
                <span
                  style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor:
                      user?.role === 'admin'
                        ? '#dc3545'
                        : user?.role === 'seller'
                          ? '#ffc107'
                          : '#007bff',
                    color: user?.role === 'seller' ? '#000' : '#fff',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}>
                  {user?.role}
                </span>
              </span>
              {user?.role === 'seller' || user?.role === 'admin' ? (
                <Link
                  to='/create-product'
                  style={{ textDecoration: 'none', color: '#28a745' }}>
                  Создайте новый продукт
                </Link>
              ) : null}
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
                Вйыти
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link
                to='/login'
                style={{ textDecoration: 'none', color: '#007bff' }}>
                Войти
              </Link>
              <Link
                to='/register'
                style={{ textDecoration: 'none', color: '#007bff' }}>
                Зарегестрироваться
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
