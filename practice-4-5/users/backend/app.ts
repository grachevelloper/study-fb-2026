import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import usersRouter from './routes/users';

const app = express();
const port = 3001;


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use(cors({ origin: "*" }));
app.use(express.json());


app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    
    if (['POST', 'PATCH'].includes(req.method)) {
      console.log('Request body:', req.body);
    }
  });
  
  next();
});


app.use('/api/users', usersRouter);


app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: "Not found" });
});


app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api-docs`);
});