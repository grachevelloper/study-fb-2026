import 'dotenv/config';
import express from 'express';
import { connectDb } from './db.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use('/api/users', usersRouter);

await connectDb();
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
