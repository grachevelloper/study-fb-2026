import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { getProductById, updateProduct } from '../services/productService';
import { type Product, type ProductInput } from '../types';

const EditProduct: React.FC = () => {
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

  const handleSubmit = async (data: ProductInput) => {
    if (!id) return;
    await updateProduct(id, data);
    navigate(`/products/${id}`);
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
          {error || 'Продукт не найден'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        Изменить продукт
      </h1>
      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        buttonText='Update Product'
      />
    </div>
  );
};

export default EditProduct;
