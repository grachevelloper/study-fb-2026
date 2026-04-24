import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../configs/index.js';
import { redisClient, saveToCache } from '../cache.js';
import type { JwtPayload, UserRole } from '../types/index.js';

export interface AuthRequest extends Request {
    user?: JwtPayload;
    cacheKey?: string;
    cacheTTL?: number;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        res.status(401).json({ error: 'Missing or invalid Authorization header. Use: Bearer <token>' });
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = payload;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        res.status(401).json({ error: 'Token validation failed' });
    }
}

export function roleMiddleware(allowedRoles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Forbidden: insufficient permissions',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
            return;
        }

        next();
    };
}

export function cacheMiddleware(keyBuilder: (req: Request) => string, ttl: number) {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const key = keyBuilder(req);
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                res.json({ source: 'cache', data: JSON.parse(cachedData) });
                return;
            }

            req.cacheKey = key;
            req.cacheTTL = ttl;
            next();
        } catch (err) {
            console.error('Cache read error:', err);
            next();
        }
    };
}

export async function respondWithCache(
    req: AuthRequest,
    res: Response,
    data: unknown
): Promise<void> {
    if (req.cacheKey && req.cacheTTL !== undefined) {
        await saveToCache(req.cacheKey, data, req.cacheTTL);
    }
    res.json({ source: 'server', data });
}
