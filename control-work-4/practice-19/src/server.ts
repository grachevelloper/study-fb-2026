import 'dotenv/config';
import express from 'express';
import { initTable } from './models/user.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use('/api/users', usersRouter);

await initTable();
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
