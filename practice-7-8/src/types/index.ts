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
    message: string;
    accessToken: string;
    user: UserWithoutPassword;
}

export interface JwtPayload {
    sub: string;
    email: string;
    first_name: string;
    last_name: string;
    iat?: number;
    exp?: number;
}