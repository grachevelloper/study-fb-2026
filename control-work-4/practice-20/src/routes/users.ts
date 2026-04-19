import { Router, type Request, type Response } from 'express';
import { User } from '../models/user.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const updates = { ...req.body, updated_at: Math.floor(Date.now() / 1000) };
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ message: 'User deleted', user });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
