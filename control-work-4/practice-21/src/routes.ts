import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { users } from './data/users.js';
import { products } from './data/products.js';
import { REFRESH_SECRET, BCRYPT_SALT_ROUNDS, USERS_CACHE_TTL, PRODUCTS_CACHE_TTL } from './configs/index.js';
import { authMiddleware, roleMiddleware, cacheMiddleware, respondWithCache, type AuthRequest } from './middlewares/index.js';
import { invalidateUsersCache, invalidateProductsCache } from './cache.js';
import {
    findUserByEmail, findUserById, findProductById, deleteProductById,
    getAllUsers, updateUser, deleteUser,
    addRefreshToken, removeRefreshToken, isRefreshTokenValid,
    generateAccessToken, generateRefreshToken, getIdFromReq
} from './utils.js';
import type { User, UserRole, RefreshTokenPayload } from './types/index.js';

const router = express.Router();

// ==================== AUTH ====================

router.post('/api/auth/register', async (req: Request, res: Response) => {
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

router.post('/api/auth/login', async (req: Request, res: Response) => {
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

router.post('/api/auth/refresh', async (req: Request, res: Response) => {
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

router.post('/api/auth/logout', authMiddleware, (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).json({ error: 'refreshToken is required' });
        return;
    }
    removeRefreshToken(refreshToken, req.user?.sub);
    res.json({ message: 'Logged out successfully' });
});

router.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
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

// ==================== USERS ====================

router.get('/api/users',
    authMiddleware,
    roleMiddleware(['admin']),
    cacheMiddleware(() => 'users:all', USERS_CACHE_TTL),
    async (req: AuthRequest, res: Response) => {
        const data = getAllUsers();
        await respondWithCache(req, res, data);
    }
);

router.get('/api/users/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
    async (req: AuthRequest, res: Response) => {
        const user = findUserById(getIdFromReq(req));
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const { password, ...data } = user;
        await respondWithCache(req, res, data);
    }
);

router.put('/api/users/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { first_name, last_name, role, isActive } = req.body;
            const updates: Partial<User> = {};
            if (first_name !== undefined) updates.first_name = first_name;
            if (last_name !== undefined) updates.last_name = last_name;
            if (role !== undefined) updates.role = role as UserRole;
            if (isActive !== undefined) updates.isActive = isActive;

            const updatedUser = updateUser(getIdFromReq(req), updates);
            if (!updatedUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            await invalidateUsersCache(getIdFromReq(req));
            res.json(updatedUser);
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Server error while updating user' });
        }
    }
);

router.delete('/api/users/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    async (req: AuthRequest, res: Response) => {
        if (req.params.id === req.user?.sub) {
            res.status(400).json({ error: 'Cannot delete yourself' });
            return;
        }

        const isDeleted = deleteUser(getIdFromReq(req));
        if (!isDeleted) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        await invalidateUsersCache(getIdFromReq(req));
        res.json({ message: 'User deleted successfully' });
    }
);

// ==================== PRODUCTS ====================

router.post('/api/products',
    authMiddleware,
    roleMiddleware(['seller', 'admin']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { title, category, description, price } = req.body;

            if (!title || !category || !description || price === undefined) {
                res.status(400).json({ error: 'All fields (title, category, description, price) are required' });
                return;
            }

            if (isNaN(price) || price < 0) {
                res.status(400).json({ error: 'Price must be a positive number' });
                return;
            }

            const newProduct = {
                id: nanoid(),
                title,
                category,
                description,
                price: Number(price),
                createdBy: req.user?.sub
            };

            products.push(newProduct);
            await invalidateProductsCache();
            res.status(201).json(newProduct);
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({ error: 'Server error while creating product' });
        }
    }
);

router.get('/api/products',
    authMiddleware,
    roleMiddleware(['user', 'seller', 'admin']),
    cacheMiddleware(() => 'products:all', PRODUCTS_CACHE_TTL),
    async (req: AuthRequest, res: Response) => {
        await respondWithCache(req, res, products);
    }
);

router.get('/api/products/:id',
    authMiddleware,
    roleMiddleware(['user', 'seller', 'admin']),
    cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
    async (req: AuthRequest, res: Response) => {
        const product = findProductById(req.params.id);
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        await respondWithCache(req, res, product);
    }
);

router.put('/api/products/:id',
    authMiddleware,
    roleMiddleware(['seller', 'admin']),
    async (req: AuthRequest, res: Response) => {
        try {
            const product = findProductById(req.params.id);
            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }

            const { title, category, description, price } = req.body;
            if (title !== undefined) product.title = title;
            if (category !== undefined) product.category = category;
            if (description !== undefined) product.description = description;
            if (price !== undefined) {
                if (isNaN(price) || price < 0) {
                    res.status(400).json({ error: 'Price must be a positive number' });
                    return;
                }
                product.price = Number(price);
            }

            await invalidateProductsCache(req.params.id);
            res.json(product);
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({ error: 'Server error while updating product' });
        }
    }
);

router.delete('/api/products/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    async (req: AuthRequest, res: Response) => {
        const isDeleted = deleteProductById(req.params.id);
        if (!isDeleted) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        await invalidateProductsCache(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    }
);

export default router;
