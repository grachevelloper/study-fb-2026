import React, { useEffect, useState } from 'react';
import { getUsers, updateUser, deleteUser } from '../services/userService';
import { type User, type UserRole } from '../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUser(userId, { role: newRole });
      await loadUsers();
      setEditingUser(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await updateUser(userId, { isActive: !currentActive });
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>User Management</h1>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #dee2e6',
              }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '1rem' }}>
                  {user.id.substring(0, 8)}...
                </td>
                <td style={{ padding: '1rem' }}>
                  {user.first_name} {user.last_name}
                </td>
                <td style={{ padding: '1rem' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  {editingUser?.id === user.id ? (
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as UserRole)
                      }
                      style={{
                        padding: '0.25rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}>
                      <option value='user'>User</option>
                      <option value='seller'>Seller</option>
                      <option value='admin'>Admin</option>
                    </select>
                  ) : (
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor:
                          user.role === 'admin'
                            ? '#dc3545'
                            : user.role === 'seller'
                              ? '#ffc107'
                              : '#007bff',
                        color: user.role === 'seller' ? '#000' : '#fff',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: user.isActive ? '#28a745' : '#6c757d',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}>
                    {user.isActive ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {editingUser?.id === user.id ? (
                      <button
                        onClick={() => setEditingUser(null)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}>
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingUser(user)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}>
                        Edit Role
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: user.isActive ? '#ffc107' : '#28a745',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}>
                      {user.isActive ? 'Block' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
