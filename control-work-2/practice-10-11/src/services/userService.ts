import { api } from './api';
import { type User } from '../types';

export const getUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, updates);
    return response.data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/users/${id}`);
    return response.data;
};