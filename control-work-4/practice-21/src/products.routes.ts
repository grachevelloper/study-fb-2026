import express, { Response } from 'express';
import { nanoid } from 'nanoid';
import { products } from './data/products.js';
import { PRODUCTS_CACHE_TTL_IN_S } from './configs/index.js';
import { authMiddleware, roleMiddleware, cacheMiddleware, respondWithCache, type AuthRequest } from './middlewares/index.js';
import { invalidateProductsCache } from './cache.js';
import { findProductById, deleteProductById } from './utils.js';

const router = express.Router();

router.post('/',
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

router.get('/',
    authMiddleware,
    roleMiddleware(['user', 'seller', 'admin']),
    cacheMiddleware(() => 'products:all', PRODUCTS_CACHE_TTL_IN_S),
    async (req: AuthRequest, res: Response) => {
        await respondWithCache(req, res, products);
    }
);

router.get('/:id',
    authMiddleware,
    roleMiddleware(['user', 'seller', 'admin']),
    cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL_IN_S),
    async (req: AuthRequest, res: Response) => {
        const product = findProductById(req.params.id);
        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        await respondWithCache(req, res, product);
    }
);

router.put('/:id',
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

router.delete('/:id',
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
