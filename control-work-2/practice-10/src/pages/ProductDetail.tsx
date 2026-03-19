import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, deleteProduct } from '../services/productService';
import { type Product } from '../types';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteProduct(id!);
      navigate('/products');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>Загрузка...</div>
    );
  }

  if (error || !product) {
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
          {error || 'Продукта не найдено'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1rem' }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
        <h1 style={{ margin: '0 0 1rem 0' }}>{product.title}</h1>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>ID:</strong> {product.id}
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Категория:</strong> {product.category}
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Цена:</strong> ${product.price}
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Описание:</strong>
          </p>
          <p
            style={{
              margin: '0.5rem 0',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
            }}>
            {product.description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to={`/edit-product/${product.id}`} style={{ flex: 1 }}>
            <button
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}>
              Именить
            </button>
          </Link>
          <button
            onClick={handleDelete}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}>
            Удалить
          </button>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to='/products' style={{ color: '#007bff' }}>
            ← К продуктам
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
