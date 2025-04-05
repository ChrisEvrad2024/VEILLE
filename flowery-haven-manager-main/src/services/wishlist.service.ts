// src/services/wishlist.service.ts - Version corrigée
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
export interface LocalWishlistItem {
    id: string;
    name: string;
    price: number;
    image: string;
    dateAdded?: string;
}

// Fonction utilitaire pour émettre un événement de mise à jour
const notifyWishlistUpdated = () => {
    try {
        // Utiliser requestAnimationFrame pour s'assurer que la notification est envoyée après un rendu
        window.requestAnimationFrame(() => {
            window.dispatchEvent(new CustomEvent('wishlistUpdated'));
        });
    } catch (error) {
        console.error("Erreur lors de l'émission de l'événement wishlistUpdated:", error);
    }
};
// Fonction utilitaire pour récupérer les éléments locaux
const getLocalWishlistItems = (): LocalWishlistItem[] => {
    try {
        const localWishlist = localStorage.getItem("wishlist");
        const items = localWishlist ? JSON.parse(localWishlist) : [];

        // Normalisation des données
        return items.map(item => ({
            ...item,
            price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
            image: item.image || '/assets/placeholder.png'
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération de la wishlist locale:", error);
        return [];
    }
};

// Récupérer la wishlist de l'utilisateur
const getWishlist = async (): Promise<WishlistItem[]> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            console.log("Utilisateur non connecté, utilisation du localStorage pour la wishlist");
            // Utilisateur non connecté, utiliser localStorage
            const wishlistItems: LocalWishlistItem[] = getLocalWishlistItems();

            // Convertir en format WishlistItem
            return wishlistItems.map(item => ({
                userId: "local",
                productId: item.id,
                dateAdded: item.dateAdded ? new Date(item.dateAdded) : new Date(),
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

        console.log("Récupération de la wishlist pour l'utilisateur:", currentUser.id);
        // Utilisateur connecté, utiliser IndexedDB
        const wishlistItems = await dbService.getByIndex<WishlistItem>("wishlist", "userId", currentUser.id);
        console.log("Éléments de wishlist trouvés:", wishlistItems.length);

        // Enrichir avec les détails des produits
        const enrichedItems = await Promise.all(
            wishlistItems.map(async item => {
                try {
                    const product = await productService.getProductById(item.productId);
                    return {
                        ...item,
                        product: product || undefined
                    };
                } catch (error) {
                    console.error(`Erreur lors de la récupération du produit ${item.productId}:`, error);
                    return item; // Retourner l'élément sans produit en cas d'erreur
                }
            })
        );

        return enrichedItems;
    } catch (error) {
        console.error("Erreur dans getWishlist:", error);
        return [];
    }
};

// Ajouter un produit à la wishlist
const addToWishlist = async (item: { id: string, name: string, price: number, image: string }): Promise<boolean> => {
    try {
        // S'assurer que l'ID est bien un string et pas undefined/null
        const productId = item.id;
        if (!productId) {
            console.error("ID de produit manquant lors de l'ajout à la wishlist");
            return false;
        }
        
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            const wishlistItems: LocalWishlistItem[] = getLocalWishlistItems();

            // Vérifier les doublons par ID de produit
            if (!wishlistItems.some(wishItem => wishItem.id === productId)) {
                const newItem = {
                    ...item,
                    dateAdded: new Date().toISOString()
                };
                
                wishlistItems.push(newItem);
                localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
                
                // Notifier les composants
                notifyWishlistUpdated();
            }

            return true;
        }

        // Utilisateur connecté, utiliser IndexedDB
        const existingItems = await dbService.getByIndex<WishlistItem>("wishlist", "userId", currentUser.id);
        
        // Vérifier les doublons par ID de produit
        if (!existingItems.some(wishItem => wishItem.productId === productId)) {
            // Créer un nouvel élément avec l'ID correct
            const newItem: WishlistItem = {
                userId: currentUser.id,
                productId: productId, // Utiliser productId de façon cohérente
                dateAdded: new Date()
            };

            await dbService.addItem("wishlist", newItem);
            
            // Notifier les composants
            notifyWishlistUpdated();
        }

        return true;
    } catch (error) {
        console.error(`Erreur dans addToWishlist pour le produit ${item.id}:`, error);
        return false;
    }
};

// Supprimer un produit de la wishlist
const removeFromWishlist = async (productId: string): Promise<boolean> => {
    try {
        console.log("Suppression de la wishlist:", productId);
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            console.log("Utilisateur non connecté, suppression du localStorage");
            // Utilisateur non connecté, utiliser localStorage
            const localWishlist = localStorage.getItem("wishlist");
            let wishlistItems: LocalWishlistItem[] = localWishlist ? JSON.parse(localWishlist) : [];

            const initialLength = wishlistItems.length;
            wishlistItems = wishlistItems.filter(item => item.id !== productId);

            if (initialLength !== wishlistItems.length) {
                localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
                console.log("Produit supprimé de la wishlist locale");

                // Notifier les composants
                notifyWishlistUpdated();
            } else {
                console.log("Produit non trouvé dans la wishlist locale");
            }

            return true;
        }

        console.log("Utilisateur connecté, suppression de IndexedDB");
        // Utilisateur connecté, utiliser IndexedDB
        const existingItems = await dbService.getByIndex<WishlistItem>("wishlist", "userId", currentUser.id);
        const existingItem = existingItems.find(item => item.productId === productId);

        if (!existingItem || !existingItem.id) {
            console.log("Produit non trouvé dans la wishlist IndexedDB");
            return false;
        }

        await dbService.deleteItem("wishlist", existingItem.id);
        console.log("Produit supprimé de la wishlist IndexedDB");

        // Notifier les composants
        notifyWishlistUpdated();

        return true;
    } catch (error) {
        console.error(`Erreur dans removeFromWishlist pour le produit ${productId}:`, error);
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
        console.error(`Erreur dans isInWishlist pour le produit ${productId}:`, error);
        return false;
    }
};

// Vider la wishlist
const clearWishlist = async (): Promise<boolean> => {
    try {
        console.log("Vidage de la wishlist");
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            console.log("Utilisateur non connecté, vidage du localStorage");
            // Utilisateur non connecté, utiliser localStorage
            localStorage.removeItem("wishlist");

            // Notifier les composants
            notifyWishlistUpdated();

            return true;
        }

        console.log("Utilisateur connecté, vidage de IndexedDB");
        // Utilisateur connecté, utiliser IndexedDB
        const wishlistItems = await dbService.getByIndex<WishlistItem>("wishlist", "userId", currentUser.id);

        // Supprimer chaque élément
        for (const item of wishlistItems) {
            if (item.id) {
                await dbService.deleteItem("wishlist", item.id);
            }
        }

        console.log(`${wishlistItems.length} éléments supprimés de la wishlist IndexedDB`);

        // Notifier les composants
        notifyWishlistUpdated();

        return true;
    } catch (error) {
        console.error("Erreur dans clearWishlist:", error);
        return false;
    }
};

// Obtenir le nombre d'articles dans la wishlist
const getWishlistCount = async (): Promise<number> => {
    try {
        const wishlist = await getWishlist();
        return wishlist.length;
    } catch (error) {
        console.error("Erreur dans getWishlistCount:", error);
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