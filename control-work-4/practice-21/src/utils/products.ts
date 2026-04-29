import { products } from '../data/products.js';

export function findProductById(id: string) {
    return products.find(p => p.id === id) || null;
}

export function deleteProductById(id: string): boolean {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    return true;
}
