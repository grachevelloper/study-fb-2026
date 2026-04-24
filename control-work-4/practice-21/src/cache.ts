import { createClient } from 'redis';
import { REDIS_URL } from './configs/index.js';

export const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

export async function initRedis(): Promise<void> {
    await redisClient.connect();
    console.log('Redis connected');
}

export async function saveToCache(key: string, data: unknown, ttl: number): Promise<void> {
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: ttl });
    } catch (err) {
        console.error('Cache save error:', err);
    }
}

export async function invalidateUsersCache(userId?: string): Promise<void> {
    try {
        await redisClient.del('users:all');
        if (userId) {
            await redisClient.del(`users:${userId}`);
        }
    } catch (err) {
        console.error('Users cache invalidate error:', err);
    }
}

export async function invalidateProductsCache(productId?: string): Promise<void> {
    try {
        await redisClient.del('products:all');
        if (productId) {
            await redisClient.del(`products:${productId}`);
        }
    } catch (err) {
        console.error('Products cache invalidate error:', err);
    }
}
