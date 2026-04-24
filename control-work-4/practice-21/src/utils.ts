import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import {
    JWT_SECRET, REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN
} from './configs/index.js';
import { users } from './data/users.js';
import { products } from './data/products.js';
import { validRefreshTokens, userRefreshTokens } from './data/tokens.js';
import type { User } from './types/index.js';
import type { AuthRequest } from './middlewares/index.js';

export function findUserByEmail(email: string) {
    return users.find(u => u.email === email) || null;
}

export function findUserById(id: string) {
    return users.find(u => u.id === id) || null;
}

export function findProductById(id: string) {
    return products.find(p => p.id === id) || null;
}

export function deleteProductById(id: string): boolean {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    return true;
}

export function getAllUsers() {
    return users.map(({ password, ...user }) => user);
}

export function updateUser(id: string, updates: Partial<User>) {
    const user = findUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

export function deleteUser(id: string): boolean {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;
    users.splice(index, 1);
    invalidateAllUserTokens(id);
    return true;
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
        tokens.forEach(t => validRefreshTokens.delete(t));
        userRefreshTokens.delete(userId);
    }
}

export function generateAccessToken(user: User): string {
    return jwt.sign(
        { sub: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
}

export function generateRefreshToken(user: User): string {
    return jwt.sign(
        { sub: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, tokenId: nanoid() },
        REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );
}

export const getIdFromReq = (req: AuthRequest) =>
    typeof req.params.id === 'object' ? req.params.id[0] : req.params.id;
