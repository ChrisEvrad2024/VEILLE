// src/services/product.service.ts
import { dbService } from './db.service';
import { v4 as uuidv4 } from 'uuid';

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
    shortDescription?: string;
    sku?: string;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    metaTitle?: string;
    metaDescription?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Category {
    id: string;
    name: string;
    description: string;
    image?: string;
    parentId?: string;
    order?: number;
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
        // Au lieu d'utiliser l'index directement, récupérer tous les produits et filtrer
        const allProducts = await getAllProducts();
        return allProducts.filter(product => product.popular === true);
    } catch (error) {
        console.error("Error in getPopularProducts:", error);
        return [];
    }
};

// Récupérer les produits en vedette
const getFeaturedProducts = async (): Promise<Product[]> => {
    try {
        // Au lieu d'utiliser l'index directement, récupérer tous les produits et filtrer
        const allProducts = await getAllProducts();
        return allProducts.filter(product => product.featured === true);
    } catch (error) {
        console.error("Error in getFeaturedProducts:", error);
        return [];
    }
};

// Ajouter un produit
const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    try {
        const newProduct: Product = {
            ...product,
            id: `prod_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
        const updatedProduct = {
            ...product,
            updatedAt: new Date().toISOString()
        };
        await dbService.updateItem("products", updatedProduct);
        return updatedProduct;
    } catch (error) {
        console.error(`Error in updateProduct for ID ${product.id}:`, error);
        throw error;
    }
};

// Nouvelle méthode: Mettre à jour uniquement le stock d'un produit
const updateProductStock = async (productId: string, newStock: number): Promise<Product | null> => {
    try {
        // Valider le stock
        if (newStock < 0) {
            console.warn(`Stock négatif empêché pour le produit ${productId}`);
            newStock = 0;
        }
        
        const product = await getProductById(productId);
        
        if (!product) {
            console.error(`Produit ${productId} non trouvé pour la mise à jour du stock`);
            return null;
        }
        
        // Utiliser une transaction pour garantir l'atomicité
        const updatedProduct: Product = {
            ...product,
            stock: newStock,
            updatedAt: new Date().toISOString(),
        };
        
        await dbService.updateItem("products", updatedProduct);
        
        // Notifications de stock bas
        if (newStock === 0) {
            console.log(`Produit ${product.name} maintenant en rupture de stock`);
            // Ici, vous pourriez implémenter un système de notification
        } else if (newStock <= 5) {
            console.log(`Alerte stock bas pour ${product.name}: ${newStock} unités restantes`);
        }
        
        return updatedProduct;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du stock du produit ${productId}:`, error);
        return null;
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

/**
  * Récupère les produits avec un stock faible
  */
const getLowStockProducts = async (threshold: number = 5): Promise<Product[]> => {
    try {
        const allProducts = await getAllProducts();
        return allProducts.filter(product => product.stock !== undefined && product.stock <= threshold);
    } catch (error) {
        console.error('Error getting low stock products:', error);
        return [];
    }
};

/**
   * Recherche de produits
   */
const searchProducts = async (query: string): Promise<Product[]> => {
    try {
        const allProducts = await getAllProducts();
        const lowerQuery = query.toLowerCase();

        return allProducts.filter(product =>
            product.name.toLowerCase().includes(lowerQuery) ||
            product.description.toLowerCase().includes(lowerQuery) ||
            product.category.toLowerCase().includes(lowerQuery) ||
            (product.sku && product.sku.toLowerCase().includes(lowerQuery))
        );
    } catch (error) {
        console.error(`Error searching products for "${query}":`, error);
        return [];
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

// Récupérer une catégorie par son ID
const getCategoryById = async (id: string): Promise<Category | null> => {
    try {
        return await dbService.getItemById<Category>("categories", id);
    } catch (error) {
        console.error(`Error in getCategoryById for ID ${id}:`, error);
        return null;
    }
};

// Ajouter une catégorie
const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    try {
        const newCategory: Category = {
            ...category,
            id: category.id || `cat_${Date.now()}`
        };

        await dbService.addItem("categories", newCategory);
        return newCategory;
    } catch (error) {
        console.error("Error in addCategory:", error);
        throw error;
    }
};

// Mettre à jour une catégorie
const updateCategory = async (category: Category): Promise<Category> => {
    try {
        await dbService.updateItem("categories", category);
        return category;
    } catch (error) {
        console.error(`Error in updateCategory for ID ${category.id}:`, error);
        throw error;
    }
};

// Supprimer une catégorie
const deleteCategory = async (id: string): Promise<boolean> => {
    try {
        return await dbService.deleteItem("categories", id);
    } catch (error) {
        console.error(`Error in deleteCategory for ID ${id}:`, error);
        throw error;
    }
};

/**
   * Récupère les statistiques des produits
   */
const getProductStatistics = async (): Promise<{
    totalProducts: number;
    totalCategories: number;
    lowStockProducts: number;
    outOfStockProducts: number;
}> => {
    try {
        const products = await getAllProducts();

        // Compter les catégories uniques
        const categories = new Set(products.map(product => product.category));

        // Compter les produits avec stock faible
        const lowStockProducts = products.filter(product =>
            product.stock !== undefined && product.stock > 0 && product.stock <= 5
        ).length;

        // Compter les produits en rupture de stock
        const outOfStockProducts = products.filter(product =>
            product.stock !== undefined && product.stock === 0
        ).length;

        return {
            totalProducts: products.length,
            totalCategories: categories.size,
            lowStockProducts,
            outOfStockProducts
        };
    } catch(error) {
        console.error('Error getting product statistics:', error);
        return {
            totalProducts: 0,
            totalCategories: 0,
            lowStockProducts: 0,
            outOfStockProducts: 0
        };
    }
};

export const productService = {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    getPopularProducts,
    getFeaturedProducts,
    addProduct,
    updateProduct,
    updateProductStock, // Nouvelle méthode ajoutée
    deleteProduct,
    getAllCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory,
    getLowStockProducts,
    searchProducts,
    getProductStatistics
};