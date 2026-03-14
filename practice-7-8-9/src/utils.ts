import { nanoid } from 'nanoid';
import { ACCESS_TOKEN_EXPIRES_IN, JWT_SECRET, REFRESH_SECRET, REFRESH_TOKEN_EXPIRES_IN } from './configs';
import { products } from './data/products';
import jwt from 'jsonwebtoken';
import { userRefreshTokens, validRefreshTokens } from './data/tokens';
import { users } from './data/users';
import { User } from './types';

export function findUserByEmail(email: string) {
    return users.find(user => user.email === email) || null;
}

export function findUserById(id: string) {
    return users.find(user => user.id === id) || null;
}

export function findProductById(id: string) {
    return products.find(product => product.id === id) || null;
}


export function deleteProductById(id: string) {
    const initialLength = products.length;

    const index = products.findIndex(product => product.id === id);

    if (index !== -1) {
        products.splice(index, 1);
    }

    return products.length !== initialLength;
}


export function addRefreshToken(token: string, userId: string): void {
    validRefreshTokens.add(token);

    if (!userRefreshTokens.has(userId)) {
        userRefreshTokens.set(userId, new Set());
    }
    userRefreshTokens.get(userId)?.add(token);
}

export function removeRefreshToken(token: string, userId?: string): void {
    validRefreshTokens.delete(token);

    if (userId && userRefreshTokens.has(userId)) {
        userRefreshTokens.get(userId)?.delete(token);
    }
}

export function isRefreshTokenValid(token: string): boolean {
    return validRefreshTokens.has(token);
}

export function invalidateAllUserTokens(userId: string): void {
    const tokens = userRefreshTokens.get(userId);
    if (tokens) {
        tokens.forEach(token => validRefreshTokens.delete(token));
        userRefreshTokens.delete(userId);
    }
}

export function generateAccessToken(user: User): string {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn']
        }
    );
}

export function generateRefreshToken(user: User): string {
    const tokenId = nanoid();
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            tokenId
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn']
        }
    );
}