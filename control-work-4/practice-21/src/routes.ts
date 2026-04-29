import express from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import productsRoutes from './products.routes.js';

const router = express.Router();

router.use('/api/auth', authRoutes);
router.use('/api/users', usersRoutes);
router.use('/api/products', productsRoutes);

export default router;
