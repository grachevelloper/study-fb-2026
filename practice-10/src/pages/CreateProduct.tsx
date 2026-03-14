import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import { createProduct } from '../services/productService';
import { type ProductInput } from '../types';

const CreateProduct: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: ProductInput) => {
    await createProduct(data);
    navigate('/products');
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        Создать новый продукт
      </h1>
      <ProductForm onSubmit={handleSubmit} buttonText='Create Product' />
    </div>
  );
};

export default CreateProduct;
