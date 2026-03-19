import React, { useState, type FormEvent } from 'react';
import { type ProductInput } from '../types';

interface ProductFormProps {
  initialData?: Partial<ProductInput>;
  onSubmit: (data: ProductInput) => Promise<void>;
  buttonText: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData = {},
  onSubmit,
  buttonText,
}) => {
  const [formData, setFormData] = useState<Partial<ProductInput>>({
    title: '',
    category: '',
    description: '',
    price: 0,
    ...initialData,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData as ProductInput);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
          Заголовок:
        </label>
        <input
          type='text'
          name='title'
          value={formData.title}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
          Категория:
        </label>
        <input
          type='text'
          name='category'
          value={formData.category}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
          Описание:
        </label>
        <textarea
          name='description'
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
          Цена:
        </label>
        <input
          type='number'
          name='price'
          value={formData.price}
          onChange={handleChange}
          required
          min='0'
          step='10'
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      <button
        type='submit'
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}>
        {loading ? 'Сохранение...' : buttonText}
      </button>
    </form>
  );
};

export default ProductForm;
