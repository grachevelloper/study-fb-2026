import { api } from './api';
import { type Product, type ProductInput } from '../types';

export const getProducts = async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products');
    return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
};

export const createProduct = async (product: ProductInput): Promise<Product> => {
    const response = await api.post<Product>('/products', product);
    return response.data;
};

export const updateProduct = async (id: string, product: Partial<ProductInput>): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, product);
    return response.data;
};

export const deleteProduct = async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/products/${id}`);
    return response.data;
};