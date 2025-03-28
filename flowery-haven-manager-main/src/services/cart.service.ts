// src/services/cart.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';
import { productService, Product } from './product.service';

// Types pour le panier
export interface CartItem {
    id?: number;
    userId: string;
    productId: string;
    quantity: number;
    dateAdded: Date;
    product?: Product;
}

// Interface pour localStorage cart
interface LocalCartItem {
    id: string;
    productId: string;
    quantity: number;
    dateAdded: string;
    product: {
        id: string;
        name: string;
        price: number;
        image: string;
    };
}

// Récupérer le panier de l'utilisateur
const getCart = async (): Promise<CartItem[]> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            const localCart = localStorage.getItem("cart");
            const cartItems: LocalCartItem[] = localCart ? JSON.parse(localCart) : [];

            // Convertir en format CartItem
            return cartItems.map(item => ({
                id: parseInt(item.id),
                userId: "local",
                productId: item.productId,
                quantity: item.quantity,
                dateAdded: new Date(item.dateAdded),
                product: {
                    id: item.productId,
                    name: item.product.name,
                    price: item.product.price,
                    images: [item.product.image],
                    description: "",
                    stock: 999,
                    category: "",
                    popular: false,
                    featured: false
                }
            }));
        }

        // Utilisateur connecté, utiliser IndexedDB
        const cartItems = await dbService.getByIndex<CartItem>("cart", "userId", currentUser.id);

        // Enrichir avec les détails des produits
        const enrichedItems = await Promise.all(
            cartItems.map(async item => {
                const product = await productService.getProductById(item.productId);
                return {
                    ...item,
                    product: product || undefined
                };
            })
        );

        return enrichedItems;
    } catch (error) {
        console.error("Error in getCart:", error);
        return [];
    }
};

// Ajouter un produit au panier
const addToCart = async (productId: string, quantity: number = 1): Promise<CartItem> => {
    try {
        const product = await productService.getProductById(productId);

        if (!product) {
            throw new Error("Produit non trouvé");
        }

        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            const localCart = localStorage.getItem("cart");
            const cartItems: LocalCartItem[] = localCart ? JSON.parse(localCart) : [];

            // Vérifier si le produit est déjà dans le panier
            const existingItemIndex = cartItems.findIndex(item => item.productId === productId);
            // src/services/cart.service.ts (suite)
            if (existingItemIndex !== -1) {
                // Mettre à jour la quantité
                cartItems[existingItemIndex].quantity += quantity;
            } else {
                // Ajouter un nouvel élément
                const newItem: LocalCartItem = {
                    id: `local_${Date.now()}`,
                    productId: product.id,
                    quantity: quantity,
                    dateAdded: new Date().toISOString(),
                    product: {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.images[0] || ''
                    }
                };

                cartItems.push(newItem);
            }

            localStorage.setItem("cart", JSON.stringify(cartItems));

            // Dispatch un event pour notifier l'interface
            window.dispatchEvent(new Event('cartUpdated'));

            // Retourner l'élément pour cohérence d'API
            return {
                userId: "local",
                productId: product.id,
                quantity: quantity,
                dateAdded: new Date(),
                product: product
            };
        }

        // Utilisateur connecté, utiliser IndexedDB
        // Vérifier si le produit est déjà dans le panier
        const existingItems = await dbService.getByIndex<CartItem>("cart", "userId", currentUser.id);
        const existingItem = existingItems.find(item => item.productId === productId);

        if (existingItem) {
            // Mettre à jour la quantité
            const updatedItem: CartItem = {
                ...existingItem,
                quantity: existingItem.quantity + quantity
            };

            await dbService.updateItem("cart", updatedItem);

            // Retourner l'élément mis à jour
            return {
                ...updatedItem,
                product
            };
        } else {
            // Ajouter un nouvel élément
            const newItem: CartItem = {
                userId: currentUser.id,
                productId: product.id,
                quantity: quantity,
                dateAdded: new Date()
            };

            const addedItem = await dbService.addItem("cart", newItem);

            // Dispatch un event pour notifier l'interface
            window.dispatchEvent(new Event('cartUpdated'));

            return {
                ...addedItem,
                product
            };
        }
    } catch (error) {
        console.error(`Error in addToCart for product ${productId}:`, error);
        throw error;
    }
};

// Mettre à jour la quantité d'un produit dans le panier
const updateCartItemQuantity = async (productId: string, quantity: number): Promise<boolean> => {
    try {
        if (quantity <= 0) {
            return await removeFromCart(productId);
        }

        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            const localCart = localStorage.getItem("cart");
            const cartItems: LocalCartItem[] = localCart ? JSON.parse(localCart) : [];

            const updatedCart = cartItems.map(item => {
                if (item.productId === productId) {
                    return { ...item, quantity };
                }
                return item;
            });

            localStorage.setItem("cart", JSON.stringify(updatedCart));

            // Dispatch un event pour notifier l'interface
            window.dispatchEvent(new Event('cartUpdated'));

            return true;
        }

        // Utilisateur connecté, utiliser IndexedDB
        const existingItems = await dbService.getByIndex<CartItem>("cart", "userId", currentUser.id);
        const existingItem = existingItems.find(item => item.productId === productId);

        if (!existingItem) {
            return false;
        }

        const updatedItem: CartItem = {
            ...existingItem,
            quantity
        };

        await dbService.updateItem("cart", updatedItem);

        // Dispatch un event pour notifier l'interface
        window.dispatchEvent(new Event('cartUpdated'));

        return true;
    } catch (error) {
        console.error(`Error in updateCartItemQuantity for product ${productId}:`, error);
        return false;
    }
};

// Supprimer un produit du panier
const removeFromCart = async (productId: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            const localCart = localStorage.getItem("cart");
            let cartItems: LocalCartItem[] = localCart ? JSON.parse(localCart) : [];

            cartItems = cartItems.filter(item => item.productId !== productId);

            localStorage.setItem("cart", JSON.stringify(cartItems));

            // Dispatch un event pour notifier l'interface
            window.dispatchEvent(new Event('cartUpdated'));

            return true;
        }

        // Utilisateur connecté, utiliser IndexedDB
        const existingItems = await dbService.getByIndex<CartItem>("cart", "userId", currentUser.id);
        const existingItem = existingItems.find(item => item.productId === productId);

        if (!existingItem || !existingItem.id) {
            return false;
        }

        await dbService.deleteItem("cart", existingItem.id);

        // Dispatch un event pour notifier l'interface
        window.dispatchEvent(new Event('cartUpdated'));

        return true;
    } catch (error) {
        console.error(`Error in removeFromCart for product ${productId}:`, error);
        return false;
    }
};

// Vider le panier
const clearCart = async (): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            // Utilisateur non connecté, utiliser localStorage
            localStorage.removeItem("cart");

            // Dispatch un event pour notifier l'interface
            window.dispatchEvent(new Event('cartUpdated'));

            return true;
        }

        // Utilisateur connecté, utiliser IndexedDB
        const cartItems = await dbService.getByIndex<CartItem>("cart", "userId", currentUser.id);

        // Supprimer chaque élément
        for (const item of cartItems) {
            if (item.id) {
                await dbService.deleteItem("cart", item.id);
            }
        }

        // Dispatch un event pour notifier l'interface
        window.dispatchEvent(new Event('cartUpdated'));

        return true;
    } catch (error) {
        console.error("Error in clearCart:", error);
        return false;
    }
};

// Obtenir le nombre d'articles dans le panier
const getCartItemCount = async (): Promise<number> => {
    try {
        const cart = await getCart();
        return cart.reduce((count, item) => count + item.quantity, 0);
    } catch (error) {
        console.error("Error in getCartItemCount:", error);
        return 0;
    }
};

// Calculer le total du panier
const getCartTotal = async (): Promise<number> => {
    try {
        const cart = await getCart();
        return cart.reduce((total, item) => {
            const price = item.product?.price || 0;
            return total + (price * item.quantity);
        }, 0);
    } catch (error) {
        console.error("Error in getCartTotal:", error);
        return 0;
    }
};

export const cartService = {
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal
};