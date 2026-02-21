import express, { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';

const app = express();
const port = 3000;


interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    isActive: boolean;
    createdAt: Date;
}

let users: User[] = [
    {
        id: nanoid(6),
        firstName: 'Петр',
        lastName: 'Петров',
        email: 'petr@example.com',
        age: 16,
        isActive: true,
        createdAt: new Date()
    },
    {
        id: nanoid(6),
        firstName: 'Иван',
        lastName: 'Иванов',
        email: 'ivan@example.com',
        age: 18,
        isActive: true,
        createdAt: new Date()
    },
    {
        id: nanoid(6),
        firstName: 'Дарья',
        lastName: 'Смирнова',
        email: 'daria@example.com',
        age: 20,
        isActive: false,
        createdAt: new Date()
    },
];

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());


app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
        
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            console.log('Request body:', req.body);
        }
        
        if (Object.keys(req.query).length > 0) {
            console.log('Query params:', req.query);
        }
    });
    
    next();
});


const findUserOr404 = (id: string, res: Response): User | null => {
    const user = users.find(u => u.id === id);
    if (!user) {
        res.status(404).json({ 
            error: "User not found",
            message: `Пользователь с ID ${id} не найден`
        });
        return null;
    }
    return user;
};


const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};


app.post("/api/users", (req: Request, res: Response) => {
    const { firstName, lastName, email, age } = req.body;

    // Валидация
    if (!firstName || !lastName || !email || age === undefined) {
        return res.status(400).json({ 
            error: "Missing required fields",
            required: ["firstName", "lastName", "email", "age"]
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ 
            error: "Invalid email format" 
        });
    }

    if (age < 0 || age > 150) {
        return res.status(400).json({ 
            error: "Age must be between 0 and 150" 
        });
    }


    if (users.some(u => u.email === email)) {
        return res.status(400).json({ 
            error: "User with this email already exists" 
        });
    }

    const newUser: User = {
        id: nanoid(6),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        age: Number(age),
        isActive: true,
        createdAt: new Date()
    };

    users.push(newUser);
    res.status(201).json(newUser);
});


app.get("/api/users", (req: Request, res: Response) => {
    const { isActive, minAge, maxAge, search } = req.query;
    
    let filteredUsers = [...users];
    

    if (isActive !== undefined) {
        const active = isActive === 'true';
        filteredUsers = filteredUsers.filter(u => u.isActive === active);
    }
    

    if (minAge !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.age >= Number(minAge));
    }
    
    if (maxAge !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.age <= Number(maxAge));
    }
    

    if (search !== undefined && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(u => 
            u.firstName.toLowerCase().includes(searchLower) ||
            u.lastName.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower)
        );
    }
    
    res.json({
        total: filteredUsers.length,
        users: filteredUsers
    });
});

app.get("/api/users/:id", (req: Request, res: Response) => {
    const user = findUserOr404(typeof req.params.id === `object` ? req.params.id[0] : req.params.id, res);
    if (!user) return;
    
    res.json(user);
});

app.patch("/api/users/:id", (req: Request, res: Response) => {
    const user = findUserOr404(typeof req.params.id === `object` ? req.params.id[0] : req.params.id, res);
    if (!user) return;

    const allowedFields = ['firstName', 'lastName', 'email', 'age', 'isActive'];
    const updates = req.body;
    
    const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
        return res.status(400).json({
            error: "Invalid fields",
            invalidFields,
            allowedFields
        });
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            error: "No fields to update"
        });
    }

    if (updates.email) {
        if (!isValidEmail(updates.email)) {
            return res.status(400).json({ 
                error: "Invalid email format" 
            });
        }
        
        const emailExists = users.some(u => 
            u.email === updates.email && u.id !== user.id
        );
        if (emailExists) {
            return res.status(400).json({ 
                error: "Email already in use" 
            });
        }
        user.email = updates.email.toLowerCase().trim();
    }


    if (updates.age !== undefined) {
        if (updates.age < 0 || updates.age > 150) {
            return res.status(400).json({ 
                error: "Age must be between 0 and 150" 
            });
        }
        user.age = Number(updates.age);
    }


    if (updates.firstName) user.firstName = updates.firstName.trim();
    if (updates.lastName) user.lastName = updates.lastName.trim();
    if (updates.isActive !== undefined) user.isActive = Boolean(updates.isActive);

    res.json(user);
});


app.delete("/api/users/:id", (req: Request, res: Response) => {
    const initialLength = users.length;
    users = users.filter(u => u.id !== req.params.id);
    
    if (users.length === initialLength) {
        return res.status(404).json({ 
            error: "User not found" 
        });
    }
    
    res.status(204).send();
});


app.get("/api/users/stats/summary", (req: Request, res: Response) => {
    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        averageAge: users.reduce((sum, u) => sum + u.age, 0) / users.length,
        minAge: Math.min(...users.map(u => u.age)),
        maxAge: Math.max(...users.map(u => u.age))
    };
    
    res.json(stats);
});


app.use((req: Request, res: Response) => {
    res.status(404).json({ 
        error: "Not found",
        message: `Route ${req.method} ${req.path} does not exist`
    });
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ 
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📝 API endpoints:`);
    console.log(`   GET    /api/users - Get all users (with filters)`);
    console.log(`   GET    /api/users/:id - Get user by ID`);
    console.log(`   GET    /api/users/stats/summary - Get user statistics`);
    console.log(`   POST   /api/users - Create new user`);
    console.log(`   PATCH  /api/users/:id - Update user`);
    console.log(`   DELETE /api/users/:id - Delete user`);
});