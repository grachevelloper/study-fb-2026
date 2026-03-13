import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { users } from './data/users';
import { products } from './data/products';
import { authMiddleware, AuthRequest } from './middlewares';
import {
    REFRESH_SECRET,
    BCRYPT_SALT_ROUNDS
} from './configs';
import { User, LoginResponse, RefreshResponse, RefreshTokenPayload } from './types';
import { findProductById, deleteProductById, findUserByEmail, addRefreshToken, generateAccessToken, generateRefreshToken, isRefreshTokenValid, removeRefreshToken } from './utils';

const router = express.Router();

async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        const { email, first_name, last_name, password } = req.body;

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

        const newUser: User = {
            id: nanoid(),
            email,
            first_name,
            last_name,
            password: await hashPassword(password)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
                last_name: user.last_name
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Действительный refresh токен
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Отсутствует refresh токен
 *       401:
 *         description: Недействительный или истекший refresh токен
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

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход из системы (инвалидация refresh токена)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный выход
 *       400:
 *         description: Отсутствует refresh токен
 */
router.post('/api/auth/logout', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ error: 'refreshToken is required' });
            return;
        }

        // Удаляем refresh токен из хранилища
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
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    res.json({
        id: req.user.sub,
        email: req.user.email,
        first_name: req.user.first_name,
        last_name: req.user.last_name
    });
});

// ... (остальные маршруты для продуктов без изменений) ...

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.post('/api/products', (req: Request, res: Response) => {
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
            price: Number(price)
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
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/api/products', (req: Request, res: Response) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Информация о товаре
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.get('/api/products/:id', authMiddleware, (req: AuthRequest, res: Response) => {
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
 *     summary: Обновить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
router.put('/api/products/:id', authMiddleware, (req: AuthRequest, res: Response) => {
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
 *     summary: Удалить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар успешно удален
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Товар не найден
 */
router.delete('/api/products/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const isDeleted = deleteProductById(typeof req.params.id === 'object' ? req.params.id[0] : req.params.id);

    if (!isDeleted) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }

    res.json({ message: 'Product deleted successfully' });
});

export default router;