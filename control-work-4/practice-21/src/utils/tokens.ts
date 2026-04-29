import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import {
    JWT_SECRET, REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN
} from '../configs/index.js';
import { validRefreshTokens, userRefreshTokens } from '../data/tokens.js';
import type { User } from '../types/index.js';

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
