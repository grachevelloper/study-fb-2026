import { Router, Request, Response} from 'express';
import * as UserModel from '../models/user.js';
import type { CreateUserDto, UpdateUserDto } from '../types/user.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { first_name, last_name, age } = req.body as CreateUserDto;
  if (!first_name || !last_name || age === undefined) {
    res.status(400).json({ error: 'first_name, last_name and age are required' });
    return;
  }
  try {
    const user = await UserModel.create({ first_name, last_name, age });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', async (_req, res: Response) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(Number(req.params.id));
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const dto = req.body as UpdateUserDto;
  if (dto.first_name === undefined && dto.last_name === undefined && dto.age === undefined) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  try {
    const user = await UserModel.update(Number(req.params.id), dto);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = await UserModel.remove(Number(req.params.id));
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ message: 'User deleted', user });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
