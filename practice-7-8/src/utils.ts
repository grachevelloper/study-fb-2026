import { products } from './data/products';
import { users } from './data/users';

export function findUserByEmail(email: string) {
    return users.find(user => user.email === email) || null;
}

export function findUserById(id: string) {
    return users.find(user => user.id === id) || null;
}

export function findProductById(id: string) {
    return products.find(product => product.id === id) || null;
}


export function deleteProductById(id: string) {
    const initialLength = products.length;
    const filtredProducts = products.filter(product => product.id !== id);
    return filtredProducts.length !== initialLength;
}