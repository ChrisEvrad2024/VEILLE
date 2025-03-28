// src/services/product.service.ts
import { dbService } from './db.service';

// Types pour les produits et catégories
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    category: string;
    popular: boolean;
    featured: boolean;
    sku?: string;
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
}

export interface Category {
    id: string;
    name: string;
    description: string;
}

// Récupérer tous les produits
const getAllProducts = async (): Promise<Product[]> => {
    try {
        return await dbService.getAllItems<Product>("products");
    } catch (error) {
        console.error("Error in getAllProducts:", error);
        return [];
    }
};

// Récupérer un produit par son ID
const getProductById = async (id: string): Promise<Product | null> => {
    try {
        return await dbService.getItemById<Product>("products", id);
    } catch (error) {
        console.error(`Error in getProductById for ID ${id}:`, error);
        return null;
    }
};

// Récupérer les produits d'une catégorie
const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
    try {
        return await dbService.getByIndex<Product>("products", "category", categoryId);
    } catch (error) {
        console.error(`Error in getProductsByCategory for category ${categoryId}:`, error);
        return [];
    }
};

// Récupérer les produits populaires
const getPopularProducts = async (): Promise<Product[]> => {
    try {
        return await dbService.getByIndex<Product>("products", "popular", true);
    } catch (error) {
        console.error("Error in getPopularProducts:", error);
        return [];
    }
};

// Ajouter un produit
const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    try {
        const newProduct: Product = {
            ...product,
            id: `prod_${Date.now()}`
        };

        await dbService.addItem("products", newProduct);
        return newProduct;
    } catch (error) {
        console.error("Error in addProduct:", error);
        throw error;
    }
};

// Mettre à jour un produit
const updateProduct = async (product: Product): Promise<Product> => {
    try {
        await dbService.updateItem("products", product);
        return product;
    } catch (error) {
        console.error(`Error in updateProduct for ID ${product.id}:`, error);
        throw error;
    }
};

// Supprimer un produit
const deleteProduct = async (id: string): Promise<boolean> => {
    try {
        return await dbService.deleteItem("products", id);
    } catch (error) {
        console.error(`Error in deleteProduct for ID ${id}:`, error);
        throw error;
    }
};

// Récupérer toutes les catégories
const getAllCategories = async (): Promise<Category[]> => {
    try {
        return await dbService.getAllItems<Category>("categories");
    } catch (error) {
        console.error("Error in getAllCategories:", error);
        return [];
    }
};

export const productService = {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    getPopularProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getAllCategories
};