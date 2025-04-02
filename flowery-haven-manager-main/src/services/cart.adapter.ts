// src/services/adapters/cart.adapter.ts

import { cartService } from '@/services/cart.service';

// Helper function to normalize product data before adding to cart
const normalizeProductData = (product: any) => {
    console.log("Normalisation du produit pour le panier:", product);

    // Check if this is a product from wishlist (which might have a different structure)
    const isFromWishlist = !product.productId && product.id;

    // Construire un objet normalisé pour éviter les erreurs
    const normalizedProduct = {
        // Utiliser le bon ID selon la source
        id: product.id || product.productId,
        productId: isFromWishlist ? product.id : product.productId,
        name: product.name || 'Produit sans nom',
        price: typeof product.price === 'number' ? product.price : 0,
        // Prioriser les sources d'image dans l'ordre
        image: product.image || (product.images && product.images.length > 0 ? product.images[0] : '/assets/placeholder.png'),
        quantity: product.quantity || 1,
        // S'assurer que nous avons une propriété images pour la compatibilité
        images: product.images || [product.image || '/assets/placeholder.png']
    };

    console.log("Produit normalisé:", normalizedProduct);
    return normalizedProduct;
};

// Add to cart with improved error handling
const addToCart = async (product: any) => {
    console.log("Tentative d'ajout au panier:", product);

    if (!product || (!product.productId && !product.id)) {
        console.error("Données produit invalides:", product);
        return {
            success: false,
            error: "ID de produit manquant"
        };
    }

    try {
        // Normalize product data to ensure compatibility
        const normalizedProduct = normalizeProductData(product);

        // Call cart service with normalized product
        await cartService.addToCart(normalizedProduct, normalizedProduct.quantity);

        return { success: true };
    } catch (error) {
        console.error(`Erreur d'ajout au panier:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue lors de l'ajout au panier"
        };
    }
};

// Get cart items
const getCartItems = async () => {
    try {
        return await cartService.getCart();
    } catch (error) {
        console.error("Erreur de récupération du panier:", error);
        return [];
    }
};

// Remove from cart
const removeFromCart = async (productId: string) => {
    try {
        if (!productId) {
            throw new Error("ID de produit requis");
        }

        await cartService.removeFromCart(productId);
        return { success: true };
    } catch (error) {
        console.error(`Erreur de suppression du panier:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
};

// Update quantity
const updateQuantity = async (productId: string, quantity: number) => {
    try {
        if (!productId) {
            throw new Error("ID de produit requis");
        }

        if (quantity < 1) {
            throw new Error("La quantité doit être au moins 1");
        }

        await cartService.updateCartItemQuantity(productId, quantity);
        return { success: true };
    } catch (error) {
        console.error(`Erreur de mise à jour de quantité:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
};

// Clear cart
const clearCart = async () => {
    try {
        await cartService.clearCart();
        return { success: true };
    } catch (error) {
        console.error("Erreur de vidage du panier:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue"
        };
    }
};

// Get cart count
const getCartCount = () => {
    return cartService.getCartItemCountSync();
};

export const cartAdapter = {
    addToCart,
    getCartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount
};