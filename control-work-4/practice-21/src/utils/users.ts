import { users } from '../data/users.js';
import type { User } from '../types/index.js';

export function findUserByEmail(email: string) {
    return users.find(u => u.email === email) || null;
}

export function findUserById(id: string) {
    return users.find(u => u.id === id) || null;
}

export function getAllUsers() {
    return users.map(({ password, ...user }) => user);
}

export function updateUser(id: string, updates: Partial<User>) {
    const user = findUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

export function deleteUser(id: string): boolean {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;
    users.splice(index, 1);
    return true;
}
