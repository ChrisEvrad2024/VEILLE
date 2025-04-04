// src/services/adapters/wishlist.adapter.ts

import { wishlistService, LocalWishlistItem } from '@/services/wishlist.service';
import { authService } from '@/services/auth.service';
import { productService } from '@/services/product.service';

// Helper function to get wishlist items from localStorage
const getWishlistItemsFromLocalStorage = (): LocalWishlistItem[] => {
    try {
        const items = localStorage.getItem("wishlist");
        return items ? JSON.parse(items) : [];
    } catch (error) {
        console.error("Échec de lecture de la wishlist locale:", error);
        return [];
    }
};

// Helper function to get wishlist count
export const getWishlistItemCount = (): number => {
    try {
        return getWishlistItemsFromLocalStorage().length;
    } catch (error) {
        console.error("Erreur de comptage wishlist:", error);
        return 0;
    }
};

// Add to wishlist with proper formatting
const addToWishlist = async (product: {
    id: string;
    name?: string;
    price?: number;
    image?: string;
    productId?: string; // Support for possible productId field
}) => {
    try {
        // Ensure we have the product ID
        const productId = product.productId || product.id;
        if (!productId) {
            throw new Error("ID de produit requis");
        }

        // If we don't have complete product data, try to fetch it
        let normalizedProduct = { ...product };
        
        if (!normalizedProduct.name || !normalizedProduct.price || !normalizedProduct.image) {
            try {
                const fullProduct = await productService.getProductById(productId);
                if (fullProduct) {
                    normalizedProduct = {
                        id: productId,
                        name: fullProduct.name,
                        price: fullProduct.price,
                        image: fullProduct.images && fullProduct.images.length > 0 
                            ? fullProduct.images[0] 
                            : '/assets/placeholder.png'
                    };
                }
            } catch (fetchError) {
                console.warn("Couldn't fetch full product details:", fetchError);
            }
        }

        // Normalize to ensure we have all required fields
        const wishlistItem = {
            id: productId,
            name: normalizedProduct.name || 'Produit sans nom',
            price: typeof normalizedProduct.price === 'number' ? normalizedProduct.price : 0,
            image: normalizedProduct.image || '/assets/placeholder.png'
        };

        console.log("Ajout à la wishlist:", wishlistItem);
        const result = await wishlistService.addToWishlist(wishlistItem);

        if (!result) {
            throw new Error("Échec d'ajout à la wishlist");
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur d'ajout à la wishlist:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
};

// Format product for cart from wishlist item
const formatProductForCart = (item: any) => {
    // Make sure we have the right structure for the cart
    return {
        productId: item.id,
        id: item.productId || item.id, // Ensure both ID fields exist
        name: item.name || 'Produit sans nom',
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
        image: item.image || '/assets/placeholder.png',
        quantity: 1,
        // Ensure images array exists for cart service
        images: [item.image || '/assets/placeholder.png']
    };
};

// Get full wishlist with product details
const getWishlist = async () => {
    try {
        // Get from service
        const wishlistItems = await wishlistService.getWishlist();
        console.log("Items bruts de wishlist:", wishlistItems.length);

        // Make sure we have a consistent format with proper image and price
        return await Promise.all(wishlistItems.map(async (item) => {
            // Handle two possible structures (product in item, or direct wishlist item)
            if (item.product) {
                return {
                    id: item.productId,
                    productId: item.productId,
                    name: item.product.name || 'Produit sans nom',
                    price: typeof item.product.price === 'number' ? item.product.price : 0,
                    // Ensure image is accessible with absolute path
                    image: item.product.images && item.product.images.length > 0
                        ? item.product.images[0]
                        : '/assets/placeholder.png',
                    dateAdded: item.dateAdded || new Date(),
                    // Ensure images array exists for potential cart operations
                    images: item.product.images || ['/assets/placeholder.png']
                };
            } else {
                // Direct wishlist item (from localStorage)
                const productId = item.productId || item.id;
                
                // Try to get complete product data
                try {
                    const product = await productService.getProductById(productId);
                    if (product) {
                        return {
                            id: productId,
                            productId: productId,
                            name: product.name,
                            price: product.price,
                            image: product.images && product.images.length > 0 
                                ? product.images[0] 
                                : '/assets/placeholder.png',
                            dateAdded: item.dateAdded || new Date(),
                            images: product.images
                        };
                    }
                } catch (fetchError) {
                    console.warn("Couldn't fetch product details for wishlist item:", fetchError);
                }
                
                // Fallback to the item data we have
                return {
                    id: productId,
                    productId: productId,
                    name: item.name || 'Produit sans nom',
                    price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
                    image: item.image || '/assets/placeholder.png',
                    dateAdded: item.dateAdded || new Date(),
                    images: [item.image || '/assets/placeholder.png']
                };
            }
        }));
    } catch (error) {
        console.error("Erreur de récupération wishlist:", error);

        // Fallback to local storage in case of error
        try {
            if (!authService.isAuthenticated()) {
                const localItems = getWishlistItemsFromLocalStorage();
                return localItems.map(item => ({
                    ...item,
                    productId: item.id,
                    images: [item.image || '/assets/placeholder.png'],
                    price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
                }));
            }
        } catch (fallbackError) {
            console.error("Fallback wishlist error:", fallbackError);
        }

        return [];
    }
};

// Remove from wishlist
const removeFromWishlist = async (productId: string) => {
    try {
        if (!productId) {
            throw new Error("ID de produit requis");
        }

        const result = await wishlistService.removeFromWishlist(productId);

        if (!result) {
            throw new Error("Produit non trouvé dans la wishlist");
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur de suppression de la wishlist:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
};

// Check if product is in wishlist
const isInWishlist = async (productId: string) => {
    try {
        if (!productId) return false;
        return await wishlistService.isInWishlist(productId);
    } catch (error) {
        console.error("Erreur de vérification wishlist:", error);

        // Fallback to local check in case of error
        try {
            if (!authService.isAuthenticated()) {
                const items = getWishlistItemsFromLocalStorage();
                return items.some(item => item.id === productId);
            }
        } catch (fallbackError) {
            console.error("Fallback isInWishlist error:", fallbackError);
        }

        return false;
    }
};

// Clear wishlist
const clearWishlist = async () => {
    try {
        const result = await wishlistService.clearWishlist();

        if (!result) {
            throw new Error("Échec de vidage de la wishlist");
        }

        return { success: true };
    } catch (error) {
        console.error("Erreur de vidage wishlist:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
};

export const wishlistAdapter = {
    getWishlistItemCount,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    isInWishlist,
    clearWishlist,
    formatProductForCart
};