import pg from '../node_modules/@types/pg/index.js';

const { Pool } = pg;

export const pool = new Pool({
  user:     process.env.PG_USER     ?? 'postgres',
  host:     process.env.PG_HOST     ?? 'localhost',
  database: process.env.PG_DATABASE ?? 'practice19',
  password: process.env.PG_PASSWORD ?? 'password',
  port:     Number(process.env.PG_PORT ?? 5432),
});
