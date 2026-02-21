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
    updatedAt: Date;
    role: 'user' | 'admin' | 'moderator';
    phone?: string;
    address?: {
        city: string;
        country: string;
        zipCode?: string;
    };
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
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        address: {
            city: 'Москва',
            country: 'Россия'
        }
    },
    {
        id: nanoid(6),
        firstName: 'Иван',
        lastName: 'Иванов',
        email: 'ivan@example.com',
        age: 18,
        isActive: true,
        role: 'admin',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20'),
        phone: '+7-999-123-45-67',
        address: {
            city: 'Санкт-Петербург',
            country: 'Россия',
            zipCode: '190000'
        }
    },
    {
        id: nanoid(6),
        firstName: 'Дарья',
        lastName: 'Смирнова',
        email: 'daria@example.com',
        age: 20,
        isActive: false,
        role: 'moderator',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
        phone: '+7-888-765-43-21'
    },
];

const config = {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3001",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    },
    pagination: {
        defaultLimit: 10,
        maxLimit: 50
    }
};

app.use(cors(config.cors));
app.use(express.json());

interface TypedRequest<T> extends Request {
    body: T;
}

interface TypedRequestQuery<T> extends Request {
    query: T;
}

interface CreateUserRequest {
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    role?: 'user' | 'admin' | 'moderator';
    phone?: string;
    address?: {
        city: string;
        country: string;
        zipCode?: string;
    };
}

interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    age?: number;
    isActive?: boolean;
    role?: 'user' | 'admin' | 'moderator';
    phone?: string;
    address?: {
        city?: string;
        country?: string;
        zipCode?: string;
    };
}

interface UserQueryParams {
    isActive?: string;
    minAge?: string;
    maxAge?: string;
    search?: string;
    role?: string;
    city?: string;
    page?: string;
    limit?: string;
    sortBy?: 'firstName' | 'lastName' | 'age' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = nanoid(4);
    
    req.headers['x-request-id'] = requestId;
    
    console.log(`\n[${new Date().toISOString()}] [${requestId}] → ${req.method} ${req.path}`);
    
    if (Object.keys(req.query).length > 0) {
        console.log(`[${requestId}] Query:`, JSON.stringify(req.query, null, 2));
    }
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log(`[${requestId}] Body:`, JSON.stringify(req.body, null, 2));
    }
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusColor = res.statusCode >= 400 ? '❌' : '✅';
        console.log(`[${requestId}] ${statusColor} ${res.statusCode} - ${duration}ms ← ${req.method} ${req.path}`);
    });
    
    next();
});

const findUserOr404 = (id: string, res: Response): User | null => {
    const user = users.find(u => u.id === id);
    if (!user) {
        res.status(404).json({ 
            error: "User not found",
            message: `Пользователь с ID ${id} не найден`,
            timestamp: new Date().toISOString()
        });
        return null;
    }
    return user;
};

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone?: string): boolean => {
    if (!phone) return true;
    const phoneRegex = /^\+?[0-9\-\s]{10,}$/;
    return phoneRegex.test(phone);
};

const paginate = (items: any[], page: number = 1, limit: number = config.pagination.defaultLimit) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return {
        items: items.slice(startIndex, endIndex),
        pagination: {
            page,
            limit,
            total: items.length,
            pages: Math.ceil(items.length / limit),
            hasNext: endIndex < items.length,
            hasPrev: startIndex > 0
        }
    };
};

app.post("/api/users", (req: TypedRequest<CreateUserRequest>, res: Response) => {
    const { firstName, lastName, email, age, role = 'user', phone, address } = req.body;

    const errors: string[] = [];
    
    if (!firstName?.trim()) errors.push("First name is required");
    if (!lastName?.trim()) errors.push("Last name is required");
    if (!email?.trim()) errors.push("Email is required");
    
    if (email && !isValidEmail(email)) {
        errors.push("Invalid email format");
    }
    
    if (age === undefined) {
        errors.push("Age is required");
    } else if (age < 0 || age > 150) {
        errors.push("Age must be between 0 and 150");
    }
    
    if (phone && !isValidPhone(phone)) {
        errors.push("Invalid phone format");
    }
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            error: "Validation failed",
            errors,
            timestamp: new Date().toISOString()
        });
    }

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({ 
            error: "Conflict",
            message: "User with this email already exists",
            timestamp: new Date().toISOString()
        });
    }

    const now = new Date();
    const newUser: User = {
        id: nanoid(8),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        age: Number(age),
        isActive: true,
        role,
        phone: phone?.trim(),
        address: address ? {
            city: address.city?.trim(),
            country: address.country?.trim(),
            zipCode: address.zipCode?.trim()
        } : undefined,
        createdAt: now,
        updatedAt: now
    };

    users.push(newUser);
    
    console.log(`✨ Новый пользователь создан: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);
    
    res.status(201).json({
        message: "User created successfully",
        user: newUser,
        timestamp: now.toISOString()
    });
});

app.get("/api/users", (req: TypedRequestQuery<UserQueryParams>, res: Response) => {
    const { 
        isActive, 
        minAge, 
        maxAge, 
        search, 
        role,
        city,
        page = '1', 
        limit = String(config.pagination.defaultLimit),
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;
    
    let filteredUsers = [...users];
    
    if (isActive !== undefined) {
        const active = isActive === 'true';
        filteredUsers = filteredUsers.filter(u => u.isActive === active);
    }
    
    if (role) {
        filteredUsers = filteredUsers.filter(u => u.role === role);
    }
    
    if (city) {
        filteredUsers = filteredUsers.filter(u => 
            u.address?.city?.toLowerCase().includes(city.toLowerCase())
        );
    }
    
    if (minAge !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.age >= Number(minAge));
    }
    
    if (maxAge !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.age <= Number(maxAge));
    }
    
    if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(u => 
            u.firstName.toLowerCase().includes(searchLower) ||
            u.lastName.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower) ||
            u.phone?.toLowerCase().includes(searchLower)
        );
    }
    
    filteredUsers.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(
        config.pagination.maxLimit, 
        Math.max(1, parseInt(limit) || config.pagination.defaultLimit)
    );
    
    const paginatedResult = paginate(filteredUsers, pageNum, limitNum);
    
    res.json({
        success: true,
        data: paginatedResult.items,
        pagination: paginatedResult.pagination,
        filters: {
            applied: {
                isActive: isActive || null,
                minAge: minAge || null,
                maxAge: maxAge || null,
                search: search || null,
                role: role || null,
                city: city || null
            },
            sort: {
                by: sortBy,
                order: sortOrder
            }
        },
        timestamp: new Date().toISOString()
    });
});

app.get("/api/users/:id", (req: Request, res: Response) => {
    const user = findUserOr404(typeof req.params.id === `object` ? req.params.id[0] : req.params.id, res);
    if (!user) return;
    
    res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString()
    });
});

app.patch("/api/users/:id", (req: TypedRequest<UpdateUserRequest>, res: Response) => {
    const user = findUserOr404(typeof req.params.id === `object` ? req.params.id[0] : req.params.id, res);
    if (!user) return;

    const allowedFields = ['firstName', 'lastName', 'email', 'age', 'isActive', 'role', 'phone', 'address'];
    const updates = req.body;
    
    const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
        return res.status(400).json({
            error: "Invalid fields",
            invalidFields,
            allowedFields,
            timestamp: new Date().toISOString()
        });
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            error: "No fields to update",
            timestamp: new Date().toISOString()
        });
    }

    const errors: string[] = [];
    
    if (updates.email) {
        if (!isValidEmail(updates.email)) {
            errors.push("Invalid email format");
        } else {
            const emailExists = users.some(u => 
                u.email.toLowerCase() === updates.email!.toLowerCase() && u.id !== user.id
            );
            if (emailExists) {
                errors.push("Email already in use");
            }
        }
    }
    
    if (updates.age !== undefined && (updates.age < 0 || updates.age > 150)) {
        errors.push("Age must be between 0 and 150");
    }
    
    if (updates.phone && !isValidPhone(updates.phone)) {
        errors.push("Invalid phone format");
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            errors,
            timestamp: new Date().toISOString()
        });
    }

    const updatedFields: string[] = [];
    
    if (updates.firstName) {
        user.firstName = updates.firstName.trim();
        updatedFields.push('firstName');
    }
    
    if (updates.lastName) {
        user.lastName = updates.lastName.trim();
        updatedFields.push('lastName');
    }
    
    if (updates.email) {
        user.email = updates.email.toLowerCase().trim();
        updatedFields.push('email');
    }
    
    if (updates.age !== undefined) {
        user.age = Number(updates.age);
        updatedFields.push('age');
    }
    
    if (updates.isActive !== undefined) {
        user.isActive = Boolean(updates.isActive);
        updatedFields.push('isActive');
    }
    
    if (updates.role) {
        user.role = updates.role;
        updatedFields.push('role');
    }
    
    if (updates.phone !== undefined) {
        user.phone = updates.phone?.trim();
        updatedFields.push('phone');
    }
    
    if (updates.address) {
        user.address = {
            city: updates.address.city?.trim() || user.address?.city || '',
            country: updates.address.country?.trim() || user.address?.country || '',
            zipCode: updates.address.zipCode?.trim() || user.address?.zipCode
        };
        updatedFields.push('address');
    }
    
    user.updatedAt = new Date();
    
    console.log(`📝 Пользователь ${user.id} обновлен:`, updatedFields.join(', '));
    
    res.json({
        success: true,
        message: "User updated successfully",
        updatedFields,
        data: user,
        timestamp: new Date().toISOString()
    });
});

app.delete("/api/users/:id", (req: Request, res: Response) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ 
            error: "User not found",
            message: `Пользователь с ID ${req.params.id} не найден`,
            timestamp: new Date().toISOString()
        });
    }
    
    const deletedUser = users[userIndex];
    users = users.filter(u => u.id !== req.params.id);
    
    console.log(`🗑️ Пользователь удален: ${deletedUser.firstName} ${deletedUser.lastName} (${deletedUser.email})`);
    
    res.status(200).json({
        success: true,
        message: "User deleted successfully",
        deletedUser: {
            id: deletedUser.id,
            name: `${deletedUser.firstName} ${deletedUser.lastName}`,
            email: deletedUser.email
        },
        timestamp: new Date().toISOString()
    });
});

app.get("/api/users/stats/summary", (req: Request, res: Response) => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const byRole = {
        user: users.filter(u => u.role === 'user').length,
        admin: users.filter(u => u.role === 'admin').length,
        moderator: users.filter(u => u.role === 'moderator').length
    };
    
    const ages = users.map(u => u.age);
    const ageStats = {
        average: ages.reduce((a, b) => a + b, 0) / total || 0,
        min: Math.min(...ages),
        max: Math.max(...ages),
        distribution: {
            under18: users.filter(u => u.age < 18).length,
            between18And30: users.filter(u => u.age >= 18 && u.age <= 30).length,
            above30: users.filter(u => u.age > 30).length
        }
    };
    
    const withPhone = users.filter(u => u.phone).length;
    const withAddress = users.filter(u => u.address).length;
    
    const cities = users
        .filter(u => u.address?.city)
        .reduce((acc: Record<string, number>, u) => {
            const city = u.address!.city;
            acc[city] = (acc[city] || 0) + 1;
            return acc;
        }, {});
    
    res.json({
        success: true,
        data: {
            total,
            active,
            inactive: total - active,
            byRole,
            ageStats,
            contacts: {
                withPhone,
                withAddress,
                phonePercentage: total ? Math.round((withPhone / total) * 100) : 0,
                addressPercentage: total ? Math.round((withAddress / total) * 100) : 0
            },
            cities: Object.keys(cities).length > 0 ? cities : null,
            lastUpdated: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
    });
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ 
        error: "Not found",
        message: `Route ${req.method} ${req.path} does not exist`,
        timestamp: new Date().toISOString()
    });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ 
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`\n🚀 Server running at http://localhost:${port}`);
    console.log(`📝 API endpoints:`);
    console.log(`   GET    /api/users - Get all users (with filters)`);
    console.log(`   GET    /api/users/:id - Get user by ID`);
    console.log(`   GET    /api/users/stats/summary - Get user statistics`);
    console.log(`   POST   /api/users - Create new user`);
    console.log(`   PATCH  /api/users/:id - Update user`);
    console.log(`   DELETE /api/users/:id - Delete user\n`);
});