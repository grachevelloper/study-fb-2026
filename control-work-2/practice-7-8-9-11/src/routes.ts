import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { users } from './data/users';
import { products } from './data/products';
import { authMiddleware, roleMiddleware, AuthRequest } from './middlewares';
import {
    REFRESH_SECRET,
    BCRYPT_SALT_ROUNDS
} from './configs';
import { User, LoginResponse, RefreshResponse, RefreshTokenPayload, UserRole } from './types';
import {
    findProductById,
    deleteProductById,
    findUserByEmail,
    addRefreshToken,
    generateAccessToken,
    generateRefreshToken,
    isRefreshTokenValid,
    removeRefreshToken,
    findUserById,
    getAllUsers,
    updateUser,
    deleteUser,
    getIdFromAuthReq
} from './utils';

const router = express.Router();

async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

// ==================== ПУБЛИЧНЫЕ МАРШРУТЫ (Гость) ====================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 */
router.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        const { email, first_name, last_name, password, role } = req.body;

        if (!email || !first_name || !last_name || !password) {
            res.status(400).json({
                error: 'All fields (email, first_name, last_name, password) are required'
            });
            return;
        }

        if (findUserByEmail(email)) {
            res.status(400).json({ error: 'User with this email already exists' });
            return;
        }

        // Определяем роль: если это первый пользователь - админ, иначе обычный пользователь
        // Можно также принимать роль из запроса (для тестирования)
        let userRole: UserRole = 'user';
        if (role && ['user', 'seller', 'admin'].includes(role)) {
            userRole = role as UserRole;
        } else if (users.length === 0) {
            userRole = 'admin'; // Первый пользователь - админ
        }

        const newUser: User = {
            id: nanoid(),
            email,
            first_name,
            last_name,
            password: await hashPassword(password),
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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 */
router.post('/api/auth/login', async (req: Request, res: Response<LoginResponse | { error: string }>) => {
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

        const isPasswordValid = await verifyPassword(password, user.password);
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
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление пары токенов
 *     tags: [Auth]
 */
router.post('/api/auth/refresh', async (req: Request, res: Response<RefreshResponse | { error: string }>) => {
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
            if (!user) {
                res.status(401).json({ error: 'User not found' });
                return;
            }

            if (!user.isActive) {
                res.status(403).json({ error: 'Account is blocked' });
                return;
            }

            removeRefreshToken(refreshToken, user.id);

            const newAccessToken = generateAccessToken(user);
            const newRefreshToken = generateRefreshToken(user);

            addRefreshToken(newRefreshToken, user.id);

            res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            });

        } catch (err) {
            removeRefreshToken(refreshToken);

            if (err instanceof jwt.TokenExpiredError) {
                res.status(401).json({ error: 'Refresh token expired' });
                return;
            }
            if (err instanceof jwt.JsonWebTokenError) {
                res.status(401).json({ error: 'Invalid refresh token' });
                return;
            }
            res.status(401).json({ error: 'Token validation failed' });
        }

    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Server error during token refresh' });
    }
});

// ==================== МАРШРУТЫ ДЛЯ АУТЕНТИФИЦИРОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ ====================

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход из системы
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/api/auth/logout', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ error: 'refreshToken is required' });
            return;
        }

        removeRefreshToken(refreshToken, req.user?.sub);

        res.json({ message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Server error during logout' });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
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

    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isActive: user.isActive
    });
});

// ==================== МАРШРУТЫ ДЛЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ (ТОЛЬКО АДМИН) ====================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/api/users',
    authMiddleware,
    roleMiddleware(['admin']),
    (req: AuthRequest, res: Response) => {
        const usersList = getAllUsers();
        res.json(usersList);
    }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/api/users/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    (req: AuthRequest, res: Response) => {
        const user = findUserById(getIdFromAuthReq(req));

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить пользователя (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
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

            const updatedUser = updateUser(getIdFromAuthReq(req), updates);

            if (!updatedUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json(updatedUser);
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Server error while updating user' });
        }
    }
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать/удалить пользователя (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/api/users/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    (req: AuthRequest, res: Response) => {
        // Не даем админу удалить самого себя
        if (req.params.id === req.user?.sub) {
            res.status(400).json({ error: 'Cannot delete yourself' });
            return;
        }

        const isDeleted = deleteUser(getIdFromAuthReq(req));

        if (!isDeleted) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ message: 'User deleted successfully' });
    }
);

// ==================== МАРШРУТЫ ДЛЯ ТОВАРОВ ====================

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар (только продавец и админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.post('/api/products',
    authMiddleware,
    roleMiddleware(['seller', 'admin']),
    (req: AuthRequest, res: Response) => {
        try {
            const { title, category, description, price } = req.body;

            if (!title || !category || !description || price === undefined) {
                res.status(400).json({
                    error: 'All fields (title, category, description, price) are required'
                });
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
            res.status(201).json(newProduct);

        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({ error: 'Server error while creating product' });
        }
    });

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров (любой пользователь)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.get('/api/products',
    authMiddleware,
    roleMiddleware(['user', 'seller', 'admin']),
    (req: AuthRequest, res: Response) => {
        res.json(products);
    });

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID (любой пользователь)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.get('/api/products/:id',
    authMiddleware,
    roleMiddleware(['user', 'seller', 'admin']),
    (req: AuthRequest, res: Response) => {
        const product = findProductById(typeof req.params.id === 'object' ? req.params.id[0] : req.params.id);

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json(product);
    });

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (только продавец и админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.put('/api/products/:id',
    authMiddleware,
    roleMiddleware(['seller', 'admin']),
    (req: AuthRequest, res: Response) => {
        try {
            const product = findProductById(typeof req.params.id === 'object' ? req.params.id[0] : req.params.id);

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

            res.json(product);

        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({ error: 'Server error while updating product' });
        }
    });

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (только админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/api/products/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    (req: AuthRequest, res: Response) => {
        const isDeleted = deleteProductById(typeof req.params.id === 'object' ? req.params.id[0] : req.params.id);

        if (!isDeleted) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        res.json({ message: 'Product deleted successfully' });
    });

export default router;