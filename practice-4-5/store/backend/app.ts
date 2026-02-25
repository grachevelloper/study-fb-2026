import express, { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';

const app = express();
const port = 3003;

interface Product {
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    stock: number;
    rating?: number;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

let products: Product[] = [
    {
        id: nanoid(6),
        name: 'Ноутбук ASUS',
        category: 'Электроника',
        description: '15.6", Intel Core i5, 8GB RAM, 512GB SSD',
        price: 65000,
        stock: 15,
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: nanoid(6),
        name: 'Смартфон Xiaomi',
        category: 'Электроника',
        description: '6.5", 128GB, 48MP камера',
        price: 28000,
        stock: 23,
        rating: 4.3,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: nanoid(6),
        name: 'Наушники Sony',
        category: 'Аксессуары',
        description: 'Беспроводные, шумоподавление',
        price: 12000,
        stock: 8,
        rating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: nanoid(6),
        name: 'Клавиатура Logitech',
        category: 'Аксессуары',
        description: 'Механическая, RGB подсветка',
        price: 5500,
        stock: 12,
        rating: 4.2,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: nanoid(6),
        name: 'Монитор Samsung',
        category: 'Электроника',
        description: '27", 4K, IPS матрица',
        price: 32000,
        stock: 6,
        rating: 4.6,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: nanoid(6),
        name: 'Мышь Razer',
        category: 'Аксессуары',
        description: 'Игровая, 16000 DPI',
        price: 4500,
        stock: 19,
        rating: 4.4,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: nanoid(6),
        name: 'Внешний диск',
        category: 'Хранение',
        description: '1TB, USB 3.0',
        price: 4800,
        stock: 11,
        rating: 4.1,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: nanoid(6),
        name: 'Принтер HP',
        category: 'Периферия',
        description: 'Лазерный, WiFi',
        price: 15000,
        stock: 4,
        rating: 4.0,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: nanoid(6),
        name: 'Веб-камера',
        category: 'Периферия',
        description: '1080p, автофокус',
        price: 3500,
        stock: 7,
        rating: 4.2,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: nanoid(6),
        name: 'Микрофон',
        category: 'Аксессуары',
        description: 'USB, для стриминга',
        price: 6200,
        stock: 5,
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/api/products", (req: Request, res: Response) => {
    const { category, minPrice, maxPrice, inStock } = req.query;
    
    let filtered = [...products];
    
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (minPrice) {
        filtered = filtered.filter(p => p.price >= Number(minPrice));
    }
    
    if (maxPrice) {
        filtered = filtered.filter(p => p.price <= Number(maxPrice));
    }
    
    if (inStock === 'true') {
        filtered = filtered.filter(p => p.stock > 0);
    }
    
    res.json({ success: true, data: filtered });
});

app.get("/api/products/:id", (req: Request, res: Response) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.json({ success: true, data: product });
});

app.post("/api/products", (req: Request, res: Response) => {
    const { name, category, description, price, stock } = req.body;
    
    if (!name || !category || !description || !price || stock === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    const newProduct: Product = {
        id: nanoid(8),
        name,
        category,
        description,
        price: Number(price),
        stock: Number(stock),
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    products.push(newProduct);
    res.status(201).json({ success: true, data: newProduct });
});

app.patch("/api/products/:id", (req: Request, res: Response) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    const allowedFields = ['name', 'category', 'description', 'price', 'stock', 'rating'];
    
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            // @ts-ignore
            product[key] = req.body[key];
        }
    });
    
    product.updatedAt = new Date();
    res.json({ success: true, data: product });
});

app.delete("/api/products/:id", (req: Request, res: Response) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    products.splice(index, 1);
    res.status(204).send();
});

app.get("/api/categories", (req: Request, res: Response) => {
    const categories = [...new Set(products.map(p => p.category))];
    res.json({ success: true, data: categories });
});

app.listen(port, () => {
    console.log(`Store API running on http://localhost:${port}`);
});