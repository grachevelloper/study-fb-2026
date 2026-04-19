import { pool } from '../db.js';
import type { User, CreateUserDto, UpdateUserDto } from '../types/user.js';

export async function initTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL       PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name  VARCHAR(100) NOT NULL,
      age        INTEGER      NOT NULL,
      created_at BIGINT       NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
      updated_at BIGINT       NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
    )
  `);
  console.log('Table "users" is ready');
}

export async function findAll(): Promise<User[]> {
  const { rows } = await pool.query<User>('SELECT * FROM users ORDER BY id');
  return rows;
}

export async function findById(id: number): Promise<User | null> {
  const { rows } = await pool.query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function create(dto: CreateUserDto): Promise<User> {
  const now = Math.floor(Date.now() / 1000);
  const { rows } = await pool.query<User>(
    `INSERT INTO users (first_name, last_name, age, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [dto.first_name, dto.last_name, dto.age, now, now],
  );
  return rows[0];
}

export async function update(id: number, dto: UpdateUserDto): Promise<User | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.first_name !== undefined) { fields.push(`first_name = $${idx++}`); values.push(dto.first_name); }
  if (dto.last_name  !== undefined) { fields.push(`last_name = $${idx++}`);  values.push(dto.last_name); }
  if (dto.age        !== undefined) { fields.push(`age = $${idx++}`);        values.push(dto.age); }

  fields.push(`updated_at = $${idx++}`);
  values.push(Math.floor(Date.now() / 1000));
  values.push(id);

  const { rows } = await pool.query<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return rows[0] ?? null;
}

export async function remove(id: number): Promise<User | null> {
  const { rows } = await pool.query<User>('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  return rows[0] ?? null;
}
