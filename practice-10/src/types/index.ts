export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface UserInput {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
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