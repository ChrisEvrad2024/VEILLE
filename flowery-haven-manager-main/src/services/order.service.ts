// src/services/order.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';
import { cartService, CartItem } from './cart.service';
import { addressService, Address } from './address.service';

// Types pour les commandes
export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
}

export interface Order {
    id: string;
    userId: string;
    orderItems: OrderItem[];
    orderDate: Date;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total: number;
    shippingAddress: Address;
    billingAddress: Address;
    paymentMethod: string;
    trackingNumber?: string;
    notes?: string;
}

// Créer une nouvelle commande
const createOrder = async (
    shippingAddressId: string,
    billingAddressId: string,
    paymentMethod: string,
    notes?: string
): Promise<Order> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Récupérer le panier
        const cartItems = await cartService.getCart();

        if (cartItems.length === 0) {
            throw new Error("Le panier est vide");
        }

        // Récupérer les adresses
        const shippingAddress = await addressService.getAddressById(shippingAddressId);
        const billingAddress = await addressService.getAddressById(billingAddressId);

        if (!shippingAddress || !billingAddress) {
            throw new Error("Adresses invalides");
        }

        // Calculer le total
        const total = cartItems.reduce((sum, item) => {
            const price = item.product?.price || 0;
            return sum + (price * item.quantity);
        }, 0);

        // Créer les articles de la commande
        const orderItems: OrderItem[] = cartItems.map(item => ({
            productId: item.productId,
            name: item.product?.name || "Produit inconnu",
            price: item.product?.price || 0,
            quantity: item.quantity,
            imageUrl: item.product?.images[0] || ""
        }));

        // Créer la commande
        const newOrder: Order = {
            id: `order_${Date.now()}`,
            userId: currentUser.id,
            orderItems,
            orderDate: new Date(),
            status: 'pending',
            total,
            shippingAddress,
            billingAddress,
            paymentMethod,
            notes
        };

        // Enregistrer la commande
        await dbService.addItem("orders", newOrder);

        // Vider le panier
        await cartService.clearCart();

        return newOrder;
    } catch (error) {
        console.error("Error in createOrder:", error);
        throw error;
    }
};

// Récupérer les commandes de l'utilisateur
const getUserOrders = async (): Promise<Order[]> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            return [];
        }

        return await dbService.getByIndex<Order>("orders", "userId", currentUser.id);
    } catch (error) {
        console.error("Error in getUserOrders:", error);
        return [];
    }
};

// Récupérer une commande par son ID
const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
        const order = await dbService.getItemById<Order>("orders", orderId);

        if (!order) {
            return null;
        }

        // Vérifier que l'utilisateur actuel est bien le propriétaire de la commande
        const currentUser = authService.getCurrentUser();

        if (!currentUser || (order.userId !== currentUser.id && !authService.isAdmin())) {
            return null;
        }

        return order;
    } catch (error) {
        console.error(`Error in getOrderById for order ${orderId}:`, error);
        return null;
    }
};

// Mettre à jour le statut d'une commande (admin uniquement)
const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const order = await dbService.getItemById<Order>("orders", orderId);

        if (!order) {
            return false;
        }

        // Mettre à jour le statut
        order.status = status;

        // Si expédié, ajouter un numéro de suivi
        if (status === 'shipped' && !order.trackingNumber) {
            order.trackingNumber = `TRK${Math.floor(Math.random() * 1000000)}`;
        }

        // Enregistrer les modifications
        await dbService.updateItem("orders", order);

        return true;
    } catch (error) {
        console.error(`Error in updateOrderStatus for order ${orderId}:`, error);
        return false;
    }
};

// Annuler une commande
const cancelOrder = async (orderId: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const order = await dbService.getItemById<Order>("orders", orderId);

        if (!order) {
            return false;
        }

        // Vérifier que l'utilisateur est le propriétaire ou un admin
        if (order.userId !== currentUser.id && !authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        // Vérifier que la commande peut être annulée
        if (order.status === 'shipped' || order.status === 'delivered') {
            throw new Error("Impossible d'annuler une commande expédiée ou livrée");
        }

        // Mettre à jour le statut
        order.status = 'cancelled';

        // Enregistrer les modifications
        await dbService.updateItem("orders", order);

        return true;
    } catch (error) {
        console.error(`Error in cancelOrder for order ${orderId}:`, error);
        return false;
    }
};

// Récupérer toutes les commandes (admin uniquement)
const getAllOrders = async (): Promise<Order[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        return await dbService.getAllItems<Order>("orders");
    } catch (error) {
        console.error("Error in getAllOrders:", error);
        return [];
    }
};

export const orderService = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getAllOrders
};