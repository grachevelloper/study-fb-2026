const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';

export const api = {
    async getProducts() {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();

        return data.data || data;
    },

    async getProduct(id) {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const data = await response.json();
        return data.data || data;
    },

    async createProduct(productData) {

        const backendData = {
            name: productData.name,
            category: productData.category,
            description: productData.description,
            price: productData.price,
            stock: productData.quantity // quantity -> stock
        };
        
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendData),
        });
        if (!response.ok) throw new Error('Failed to create product');
        const data = await response.json();

        const result = data.data || data;
        if (result && result.stock !== undefined) {
            result.quantity = result.stock;
        }
        return result;
    },

    async updateProduct(id, productData) {

        const backendData = { ...productData };
        if (backendData.quantity !== undefined) {
            backendData.stock = backendData.quantity;
            delete backendData.quantity;
        }
        
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendData),
        });
        if (!response.ok) throw new Error('Failed to update product');
        const data = await response.json();

        const result = data.data || data;
        if (result && result.stock !== undefined) {
            result.quantity = result.stock;
        }
        return result;
    },

    async deleteProduct(id) {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete product');
        return true;
    },

    async getCategories() {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        return data.data || data;
    }
};