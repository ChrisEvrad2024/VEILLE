// src/services/wishlist.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';
import { productService, Product } from './product.service';

// Types pour la wishlist
export interface WishlistItem {
    id?: number;
    userId: string;
    productId: string;
    dateAdded: Date;
    product?: Product;
}

// Interface pour localStorage wishlist
interface LocalWishlistItem {
    id: string;
    name: string;
    price: number;
    image: string;
}

// Récupérer la wishlist de l'utilisateur
const getWishlist = async (): Promise<WishlistItem[]> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            const localWishlist = localStorage.getItem("wishlist");
            const wishlistItems: LocalWishlistItem[] = localWishlist ? JSON.parse(localWishlist) : [];

            // Convertir en format WishlistItem
            return wishlistItems.map(item => ({
                userId: "local",
                productId: item.id,
                dateAdded: new Date(),
                product: {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    images: [item.image],
                    description: "",
                    stock: 999,
                    category: "",
                    popular: false,
                    featured: false
                }
            }));
        }

        // Utilisateur connecté, utiliser IndexedDB
        const wishlistItems = await dbService.getByIndex<WishlistItem>("wishlist", "userId", currentUser.id);

        // Enrichir avec les détails des produits
        const enrichedItems = await Promise.all(
            wishlistItems.map(async item => {
                const product = await productService.getProductById(item.productId);
                return {
                    ...item,
                    product: product || undefined
                };
            })
        );

        return enrichedItems;
    } catch (error) {
        console.error("Error in getWishlist:", error);
        return [];
    }
};

// Ajouter un produit à la wishlist
const addToWishlist = async (item: { id: string, name: string, price: number, image: string }): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            const localWishlist = localStorage.getItem("wishlist");
            const wishlistItems: LocalWishlistItem[] = localWishlist ? JSON.parse(localWishlist) : [];

            // Vérifier si le produit est déjà dans la wishlist
            if (!wishlistItems.some(wishItem => wishItem.id === item.id)) {
                wishlistItems.push(item);
                localStorage.setItem("wishlist", JSON.stringify(wishlistItems));

                // Dispatch un event pour notifier l'interface
                window.dispatchEvent(new Event('wishlistUpdated'));
            }

            return true;
        }

        // Utilisateur connecté, utiliser IndexedDB
        // Vérifier si le produit est déjà dans la wishlist
        const existingItems = await dbService.getByIndex<WishlistItem>("wishlist", "userId", currentUser.id);

        if (existingItems.some(wishItem => wishItem.productId === item.id)) {
            return true; // Déjà dans la wishlist
        }

        // Ajouter un nouvel élément
        const newItem: WishlistItem = {
            userId: currentUser.id,
            productId: item.id,
            dateAdded: new Date()
        };

        await dbService.addItem("wishlist", newItem);

        // Dispatch un event pour notifier l'interface
        window.dispatchEvent(new Event('wishlistUpdated'));

        return true;
    } catch (error) {
        console.error(`Error in addToWishlist for product ${item.id}:`, error);
        return false;
    }
};

// Supprimer un produit de la wishlist
const removeFromWishlist = async (productId: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            const localWishlist = localStorage.getItem("wishlist");
            let wishlistItems: LocalWishlistItem[] = localWishlist ? JSON.parse(localWishlist) : [];

            wishlistItems = wishlistItems.filter(item => item.id !== productId);

            localStorage.setItem("wishlist", JSON.stringify(wishlistItems));

            // Dispatch un event pour notifier l'interface
            window.dispatchEvent(new Event('wishlistUpdated'));

            return true;
        }

        // Utilisateur connecté, utiliser IndexedDB
        const existingItems = await dbService.getByIndex<WishlistItem>("wishlist", "userId", currentUser.id);
        const existingItem = existingItems.find(item => item.productId === productId);

        if (!existingItem || !existingItem.id) {
            return false;
        }

        await dbService.deleteItem("wishlist", existingItem.id);

        // Dispatch un event pour notifier l'interface
        window.dispatchEvent(new Event('wishlistUpdated'));

        return true;
    } catch (error) {
        console.error(`Error in removeFromWishlist for product ${productId}:`, error);
        return false;
    }
};

// Vérifier si un produit est dans la wishlist
const isInWishlist = async (productId: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            const localWishlist = localStorage.getItem("wishlist");
            const wishlistItems: LocalWishlistItem[] = localWishlist ? JSON.parse(localWishlist) : [];

            return wishlistItems.some(item => item.id === productId);
        }

        // Utilisateur connecté, utiliser IndexedDB
        const existingItems = await dbService.getByIndex<WishlistItem>("wishlist", "userId", currentUser.id);

        return existingItems.some(item => item.productId === productId);
    } catch (error) {
        console.error(`Error in isInWishlist for product ${productId}:`, error);
        return false;
    }
};

// Vider la wishlist
const clearWishlist = async (): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            localStorage.removeItem("wishlist");

            // Dispatch un event pour notifier l'interface
            window.dispatchEvent(new Event('wishlistUpdated'));

            return true;
        }

        // Utilisateur connecté, utiliser IndexedDB
        const wishlistItems = await dbService.getByIndex<WishlistItem>("wishlist", "userId", currentUser.id);

        // Supprimer chaque élément
        for (const item of wishlistItems) {
            if (item.id) {
                await dbService.deleteItem("wishlist", item.id);
            }
        }

        // Dispatch un event pour notifier l'interface
        window.dispatchEvent(new Event('wishlistUpdated'));

        return true;
    } catch (error) {
        console.error("Error in clearWishlist:", error);
        return false;
    }
};

// Obtenir le nombre d'articles dans la wishlist
const getWishlistCount = async (): Promise<number> => {
    try {
        const wishlist = await getWishlist();
        return wishlist.length;
    } catch (error) {
        console.error("Error in getWishlistCount:", error);
        return 0;
    }
};

export const wishlistService = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    getWishlistCount
};