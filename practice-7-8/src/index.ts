import express, { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { PORT } from './configs';
import { swaggerSpec } from './swagger';

const app = express();

app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Auth Products API Documentation'
}));

// JSON версия спецификации
app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

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
    console.log(`📚 Swagger UI available on http://localhost:${PORT}/api-docs`);
    console.log(`📋 Swagger JSON on http://localhost:${PORT}/api-docs.json`);
    console.log('\n📋 Available routes:');
    console.log('  🔐 Auth:');
    console.log('    POST   /api/auth/register    - Register');
    console.log('    POST   /api/auth/login       - Login (returns JWT)');
    console.log('    GET    /api/auth/me          - Current user (requires token)');
    console.log('\n  📦 Products:');
    console.log('    POST   /api/products          - Create product (public)');
    console.log('    GET    /api/products          - All products (public)');
    console.log('    GET    /api/products/:id      - Product by ID (requires token)');
    console.log('    PUT    /api/products/:id      - Update product (requires token)');
    console.log('    DELETE /api/products/:id      - Delete product (requires token)\n');
});