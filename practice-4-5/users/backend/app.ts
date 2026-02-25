import express, { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import cors from 'cors';

const app = express();
const port = 3001;

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    isActive: boolean;
    role: 'user' | 'admin' | 'moderator';
    phone?: string;
    address?: {
        city: string;
        country: string;
        zipCode?: string;
    };
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
        role: 'user',
        createdAt: new Date()
    },
    {
        id: nanoid(6),
        firstName: 'Иван',
        lastName: 'Иванов',
        email: 'ivan@example.com',
        age: 18,
        isActive: true,
        role: 'admin',
        createdAt: new Date()
    },
    {
        id: nanoid(6),
        firstName: 'Дарья',
        lastName: 'Смирнова',
        email: 'daria@example.com',
        age: 20,
        isActive: false,
        role: 'moderator',
        createdAt: new Date()
    },
];

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
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


const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone?: string): boolean => {
    if (!phone) return true;
    return /^\+?[0-9\-\s]{10,}$/.test(phone);
};

app.post("/api/users", (req: Request, res: Response) => {
    const { firstName, lastName, email, age, role = 'user', phone, address } = req.body;

    if (!firstName || !lastName || !email || age === undefined) {
        return res.status(400).json({ 
            error: "Missing required fields",
            required: ["firstName", "lastName", "email", "age"]
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (age < 0 || age > 150) {
        return res.status(400).json({ error: "Age must be between 0 and 150" });
    }

    if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ error: "Invalid phone format" });
    }

    if (users.some(u => u.email === email)) {
        return res.status(400).json({ error: "User with this email already exists" });
    }

    const newUser: User = {
        id: nanoid(6),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        age: Number(age),
        isActive: true,
        role: role,
        phone: phone?.trim(),
        address: address ? {
            city: address.city?.trim(),
            country: address.country?.trim(),
            zipCode: address.zipCode?.trim()
        } : undefined,
        createdAt: new Date()
    };

    users.push(newUser);
    res.status(201).json(newUser);
});

app.get("/api/users", (req: Request, res: Response) => {
    const { isActive, minAge, maxAge, search, role } = req.query;
    
    let filteredUsers = [...users];
    
    if (isActive !== undefined) {
        const active = isActive === 'true';
        filteredUsers = filteredUsers.filter(u => u.isActive === active);
    }
    
    if (role) {
        filteredUsers = filteredUsers.filter(u => u.role === role);
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
            u.email.toLowerCase().includes(searchLower) ||
            u.phone?.toLowerCase().includes(searchLower)
        );
    }
    
    res.json({
        total: filteredUsers.length,
        users: filteredUsers
    });
});

app.get("/api/users/:id", (req: Request, res: Response) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
});

app.patch("/api/users/:id", (req: Request, res: Response) => {
    
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const allowedFields = ['firstName', 'lastName', 'email', 'age', 'isActive', 'role', 'phone', 'address'];
    const updates = req.body;
    
    const { id, ...validUpdates } = updates;
    
    const fieldsToUpdate = Object.keys(validUpdates).filter(key => allowedFields.includes(key));
    
    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
    }

    if (validUpdates.email) {
        if (!isValidEmail(validUpdates.email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }
        
        const emailExists = users.some(u => 
            u.email === validUpdates.email && u.id !== user.id
        );
        if (emailExists) {
            return res.status(400).json({ error: "Email already in use" });
        }
        user.email = validUpdates.email.toLowerCase().trim();
    }

    if (validUpdates.age !== undefined) {
        if (validUpdates.age < 0 || validUpdates.age > 150) {
            return res.status(400).json({ error: "Age must be between 0 and 150" });
        }
        user.age = Number(validUpdates.age);
    }

    if (validUpdates.phone !== undefined) {
        if (validUpdates.phone && !isValidPhone(validUpdates.phone)) {
            return res.status(400).json({ error: "Invalid phone format" });
        }
        user.phone = validUpdates.phone?.trim();
    }

    if (validUpdates.address) {
        user.address = {
            city: validUpdates.address.city?.trim() || user.address?.city || '',
            country: validUpdates.address.country?.trim() || user.address?.country || '',
            zipCode: validUpdates.address.zipCode?.trim() || user.address?.zipCode
        };
    }

    if (validUpdates.firstName) user.firstName = validUpdates.firstName.trim();
    if (validUpdates.lastName) user.lastName = validUpdates.lastName.trim();
    if (validUpdates.isActive !== undefined) user.isActive = Boolean(validUpdates.isActive);
    if (validUpdates.role) user.role = validUpdates.role;

    res.json(user);
});

app.delete("/api/users/:id", (req: Request, res: Response) => {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "User not found" });
    }
    
    users.splice(index, 1);
    res.status(204).send();
});

app.get("/api/users/stats/summary", (req: Request, res: Response) => {
    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        byRole: {
            user: users.filter(u => u.role === 'user').length,
            admin: users.filter(u => u.role === 'admin').length,
            moderator: users.filter(u => u.role === 'moderator').length
        },
        averageAge: users.reduce((sum, u) => sum + u.age, 0) / users.length,
        minAge: Math.min(...users.map(u => u.age)),
        maxAge: Math.max(...users.map(u => u.age))
    };
    
    res.json(stats);
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});