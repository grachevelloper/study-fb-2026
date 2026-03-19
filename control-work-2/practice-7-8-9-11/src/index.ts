import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';
import { PORT } from './configs';

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/', routes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});