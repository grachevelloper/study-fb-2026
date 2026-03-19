import React from 'react';
import { Link } from 'react-router-dom';
import { type Product } from '../types';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{product.title}</h3>
      <p style={{ margin: '0.25rem 0', color: '#666' }}>
        <strong>Категория:</strong> {product.category}
      </p>
      <p style={{ margin: '0.25rem 0', color: '#666' }}>
        <strong>Цена:</strong> ${product.price}
      </p>
      <p style={{ margin: '0.5rem 0', color: '#555' }}>{product.description}</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <Link to={`/products/${product.id}`}>
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
            Посмотреть
          </button>
        </Link>
        <Link to={`/edit-product/${product.id}`}>
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
            Изменить
          </button>
        </Link>
        <button
          onClick={() => onDelete(product.id)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
          Удалить
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
