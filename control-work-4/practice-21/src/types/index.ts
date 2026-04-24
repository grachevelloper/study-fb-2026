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

export interface UserWithoutPassword {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    isActive: boolean;
}

export interface Product {
    id: string;
    title: string;
    category: string;
    description: string;
    price: number;
    createdBy?: string;
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

export interface RefreshTokenPayload extends JwtPayload {
    tokenId?: string;
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
