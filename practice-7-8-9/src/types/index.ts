export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
}

export interface Product {
    id: string;
    title: string;
    category: string;
    description: string;
    price: number;
}

export interface UserWithoutPassword {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
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

export interface JwtPayload {
    sub: string;
    email: string;
    first_name: string;
    last_name: string;
    iat?: number;
    exp?: number;
}

export interface RefreshTokenPayload {
    sub: string;
    email: string;
    first_name: string;
    last_name: string;
    iat?: number;
    exp?: number;
    tokenId?: string;
}