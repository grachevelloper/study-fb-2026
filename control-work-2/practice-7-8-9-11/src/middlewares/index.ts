import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../configs';
import { JwtPayload, UserRole } from '../types';

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        res.status(401).json({
            error: 'Missing or invalid Authorization header. Use: Bearer <token>'
        });
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