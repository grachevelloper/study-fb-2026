import { nanoid } from 'nanoid';
import { ACCESS_TOKEN_EXPIRES_IN, JWT_SECRET, REFRESH_SECRET, REFRESH_TOKEN_EXPIRES_IN, DEFAULT_USER_ROLE } from './configs';
import { products } from './data/products';
import jwt from 'jsonwebtoken';
import { userRefreshTokens, validRefreshTokens } from './data/tokens';
import { users } from './data/users';
import { type User } from './types';
import { AuthRequest } from './middlewares';

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
            last_name: user.last_name,
            role: user.role
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
            role: user.role,
            tokenId
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn']
        }
    );
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

export function deleteUser(id: string) {
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return false;

    users.splice(index, 1);
    invalidateAllUserTokens(id);
    return true;
}

export const getIdFromAuthReq = (req: AuthRequest) => {
    return typeof req.params.id === 'object' ? req.params.id[0] : req.params.id;
}