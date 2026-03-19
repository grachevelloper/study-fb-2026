export type UserRole = 'user' | 'seller' | 'admin';

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
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
    user: UserWithoutPassword;
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

export interface UserWithoutPassword {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    isActive: boolean;
}

export interface JwtPayload {
    sub: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

export interface RefreshTokenPayload {
    sub: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    iat?: number;
    exp?: number;
    tokenId?: string;
}