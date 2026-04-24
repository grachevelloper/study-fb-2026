import express, { Request, Response, NextFunction } from 'express';
import { PORT } from './configs/index.js';
import { initRedis } from './cache.js';
import routes from './routes.js';

const app = express();

app.use(express.json());
app.use('/', routes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Something went wrong on the server' });
});

await initRedis();
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
