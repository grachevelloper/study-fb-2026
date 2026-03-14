import { api } from './api';
import { type LoginInput, type LoginResponse, type UserInput, type User } from '../types';

export const getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
    return localStorage.getItem('refreshToken');
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
};

export const removeTokens = (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

export const register = async (userData: UserInput): Promise<User> => {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
};

export const login = async (credentials: LoginInput): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data;
    setTokens(accessToken, refreshToken);
    return { accessToken, refreshToken, user };
};

export const logout = async (refreshToken: string): Promise<void> => {
    try {
        await api.post('/auth/logout', { refreshToken });
    } finally {
        removeTokens();
    }
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
};