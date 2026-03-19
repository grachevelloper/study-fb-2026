export type UserRole = 'user' | 'seller' | 'admin';

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    isActive: boolean;
}

export interface UserInput {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    role?: UserRole;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}

export interface Product {
    id: string;
    title: string;
    category: string;
    description: string;
    price: number;
    createdBy?: string;
}

export interface ProductInput {
    title: string;
    category: string;
    description: string;
    price: number;
}

export interface ApiError {
    error: string;
}