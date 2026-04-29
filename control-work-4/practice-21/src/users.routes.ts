import express, { Response } from 'express';
import { USERS_CACHE_TTL_IN_S } from './configs/index.js';
import { authMiddleware, roleMiddleware, cacheMiddleware, respondWithCache, type AuthRequest } from './middlewares/index.js';
import { invalidateUsersCache } from './cache.js';
import { findUserById, getAllUsers, updateUser, deleteUser, getIdFromReq, invalidateAllUserTokens } from './utils.js';
import type { User, UserRole } from './types/index.js';

const router = express.Router();

router.get('/',
    authMiddleware,
    roleMiddleware(['admin']),
    cacheMiddleware(() => 'users:all', USERS_CACHE_TTL_IN_S),
    async (req: AuthRequest, res: Response) => {
        const data = getAllUsers();
        await respondWithCache(req, res, data);
    }
);

router.get('/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL_IN_S),
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

router.put('/:id',
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

            const userId = getIdFromReq(req);
            const updatedUser = updateUser(userId, updates);
            if (!updatedUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            await invalidateUsersCache(userId);
            res.json(updatedUser);
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Server error while updating user' });
        }
    }
);

router.delete('/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    async (req: AuthRequest, res: Response) => {
        const userId = getIdFromReq(req);
        if (userId === req.user?.sub) {
            res.status(400).json({ error: 'Cannot delete yourself' });
            return;
        }

        const isDeleted = deleteUser(userId);
        if (!isDeleted) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        invalidateAllUserTokens(userId);
        await invalidateUsersCache(userId);
        res.json({ message: 'User deleted successfully' });
    }
);

export default router;
