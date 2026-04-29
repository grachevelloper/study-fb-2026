import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { users } from './data/users.js';
import { REFRESH_SECRET, BCRYPT_SALT_ROUNDS } from './configs/index.js';
import { authMiddleware, type AuthRequest } from './middlewares/index.js';
import {
    findUserByEmail,
    addRefreshToken,
    removeRefreshToken,
    isRefreshTokenValid,
    generateAccessToken,
    generateRefreshToken
} from './utils.js';
import type { User, UserRole, RefreshTokenPayload } from './types/index.js';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, first_name, last_name, password, role } = req.body;

        if (!email || !first_name || !last_name || !password) {
            res.status(400).json({ error: 'All fields (email, first_name, last_name, password) are required' });
            return;
        }

        if (findUserByEmail(email)) {
            res.status(400).json({ error: 'User with this email already exists' });
            return;
        }

        let userRole: UserRole = 'user';
        if (role && ['user', 'seller', 'admin'].includes(role)) {
            userRole = role as UserRole;
        } else if (users.length === 0) {
            userRole = 'admin';
        }

        const newUser: User = {
            id: nanoid(),
            email,
            first_name,
            last_name,
            password: await bcrypt.hash(password, BCRYPT_SALT_ROUNDS),
            role: userRole,
            isActive: true
        };

        users.push(newUser);

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = findUserByEmail(email);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ error: 'Account is blocked' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid password' });
            return;
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        addRefreshToken(refreshToken, user.id);

        res.json({
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, isActive: user.isActive }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ error: 'refreshToken is required' });
            return;
        }

        if (!isRefreshTokenValid(refreshToken)) {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }

        try {
            const payload = jwt.verify(refreshToken, REFRESH_SECRET) as RefreshTokenPayload;
            const user = findUserByEmail(payload.email);

            if (!user || !user.isActive) {
                res.status(401).json({ error: 'User not found or blocked' });
                return;
            }

            removeRefreshToken(refreshToken, user.id);
            const newAccessToken = generateAccessToken(user);
            const newRefreshToken = generateRefreshToken(user);
            addRefreshToken(newRefreshToken, user.id);

            res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        } catch (err) {
            removeRefreshToken(refreshToken);
            res.status(401).json({ error: 'Invalid or expired refresh token' });
        }
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Server error during token refresh' });
    }
});

router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).json({ error: 'refreshToken is required' });
        return;
    }
    removeRefreshToken(refreshToken, req.user?.sub);
    res.json({ message: 'Logged out successfully' });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    const user = findUserByEmail(req.user.email);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, isActive: user.isActive });
});

export default router;
