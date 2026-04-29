import 'dotenv/config';

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'access_secret';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret';
export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
export const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
export const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const USERS_CACHE_TTL_IN_S = 60;    
export const PRODUCTS_CACHE_TTL_IN_S = 600;
