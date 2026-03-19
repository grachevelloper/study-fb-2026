import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, deleteProduct } from '../services/productService';
import { type Product } from '../types';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((p) => p.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete product');
      }
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
        <h1>Продукты</h1>
        <Link to='/create-product'>
          <button
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}>
            Создать новый продукт
          </button>
        </Link>
      </div>

      {products.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>
          Продуктов не найдено.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
