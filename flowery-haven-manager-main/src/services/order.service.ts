// src/services/order.service.ts
import { v4 as uuidv4 } from 'uuid';
import { dbService } from './db.service';
import { cartService } from './cart.service';
import { authService } from './auth.service';
import { productService } from './product.service'; // Importation du service de produits
import { Order, OrderItem, OrderStatus, OrderStatusHistory, OrderAddress, PaymentInfo } from '@/types/order';

class OrderService {
  private orderHistoryKey = 'orderStatusHistory';

  // Méthodes de récupération
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await dbService.get<Order>('orders', orderId);
      return order || null;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    try {
      const orders = await dbService.getByUserId<Order>('orders', userId);
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const orders = await dbService.getByStatus<Order>('orders', status);
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting orders by status:', error);
      return [];
    }
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      const orders = await dbService.getAll<Order>('orders');
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  }

  // Création de commande
  async createOrder(
    shippingAddress: OrderAddress,
    billingAddress: OrderAddress | null = null,
    paymentMethod: PaymentInfo['method'] = 'card'
  ): Promise<{ success: boolean; orderId?: string; message: string }> {
    try {
      // Vérifier l'authentification
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: 'Vous devez être connecté pour passer une commande.' };
      }

      // Récupérer le panier et calculer les totaux
      const cartItems = await cartService.getCart();
      if (cartItems.length === 0) {
        return { success: false, message: 'Votre panier est vide.' };
      }

      const { subtotal, shipping, discount, total } = await cartService.getFinalTotal();
      const promoCode = await cartService.getAppliedPromoCode();
      
      // Créer les éléments de commande
      const orderId = uuidv4();
      const now = new Date().toISOString();
      
      const orderItems: OrderItem[] = cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        options: item.options,
        orderId,
        priceAtPurchase: item.price
      }));

      // Créer l'objet de commande
      const order: Order = {
        id: orderId,
        userId: currentUser.id,
        items: orderItems,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentInfo: {
          method: paymentMethod,
          status: 'pending',
        },
        subtotal,
        shipping,
        discount,
        total,
        promoCodeApplied: promoCode?.code
      };

      // Enregistrer la commande dans la base de données
      await dbService.addItem('orders', order);

      // Enregistrer l'historique du statut
      await this.addOrderStatusHistory(orderId, 'pending', 'Commande créée');

      // Vider le panier après commande réussie
      await cartService.clearCart();

      return { 
        success: true, 
        orderId, 
        message: 'Votre commande a été créée avec succès.' 
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return { 
        success: false, 
        message: 'Une erreur est survenue lors de la création de votre commande. Veuillez réessayer.' 
      };
    }
  }

  // Mise à jour du statut de commande
  async updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    note?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        return { success: false, message: 'Commande introuvable.' };
      }

      // Vérifier si le statut passe de non-livré à livré
      const isBeingDelivered = newStatus === 'delivered' && order.status !== 'delivered';

      // Mettre à jour la commande
      const updatedOrder: Order = {
        ...order,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      // Si le statut est shipped, ajouter des informations de suivi fictives
      if (newStatus === 'shipped' && !updatedOrder.trackingInfo) {
        updatedOrder.trackingInfo = {
          carrier: 'Chronopost',
          trackingNumber: `TRK${Math.floor(Math.random() * 10000000)}`,
          url: 'https://www.chronopost.fr/tracking'
        };
      }

      await dbService.updateItem('orders', updatedOrder);

      // Ajouter à l'historique des statuts
      await this.addOrderStatusHistory(
        orderId, 
        newStatus, 
        note || `Statut mis à jour: ${newStatus}`,
        authService.getCurrentUser()?.id
      );

      // Si la commande vient d'être marquée comme livrée, mettre à jour le stock
      if (isBeingDelivered) {
        await this.updateProductStockAfterDelivery(order);
      }

      return { success: true, message: 'Statut de la commande mis à jour avec succès.' };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, message: 'Une erreur est survenue lors de la mise à jour du statut.' };
    }
  }

  // Nouvelle méthode pour mettre à jour le stock des produits après livraison
  private async updateProductStockAfterDelivery(order: Order): Promise<void> {
    try {
      console.log(`Mise à jour du stock après livraison de la commande ${order.id}`);
      
      // Pour chaque produit dans la commande
      for (const item of order.items) {
        // Récupérer le produit actuel
        const product = await productService.getProductById(item.productId);
        
        if (!product) {
          console.warn(`Produit ${item.productId} non trouvé, impossible de mettre à jour le stock`);
          continue;
        }
        
        // Calculer le nouveau stock
        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        
        // Mettre à jour le stock du produit
        await productService.updateProductStock(product.id, newStock);
        
        console.log(`Stock mis à jour pour ${product.name}: ${currentStock} → ${newStock}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock après livraison:', error);
    }
  }

  // Historique des statuts
  private async addOrderStatusHistory(
    orderId: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string
  ): Promise<void> {
    try {
      const historyItem: OrderStatusHistory = {
        orderId,
        status,
        timestamp: new Date().toISOString(),
        note,
        updatedBy
      };

      // Récupérer l'historique existant
      const existingHistory = this.getOrderStatusHistoryFromStorage(orderId);
      
      // Ajouter le nouvel élément
      existingHistory.push(historyItem);
      
      // Sauvegarder
      localStorage.setItem(
        `${this.orderHistoryKey}_${orderId}`, 
        JSON.stringify(existingHistory)
      );
    } catch (error) {
      console.error('Error adding order status history:', error);
    }
  }

  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    return this.getOrderStatusHistoryFromStorage(orderId);
  }

  private getOrderStatusHistoryFromStorage(orderId: string): OrderStatusHistory[] {
    try {
      const history = localStorage.getItem(`${this.orderHistoryKey}_${orderId}`);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  // Méthodes auxiliaires
  getOrderStatusConfig(status: OrderStatus): { 
    label: string; 
    color: string; 
    icon: string;
    description: string;
  } {
    const statusConfig = {
      pending: {
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: 'Clock',
        description: 'Votre commande a été reçue et est en attente de traitement.'
      },
      processing: {
        label: 'En traitement',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: 'RotateCw',
        description: 'Nous préparons actuellement votre commande.'
      },
      shipped: {
        label: 'Expédiée',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: 'Truck',
        description: 'Votre commande a été expédiée et est en route.'
      },
      delivered: {
        label: 'Livrée',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: 'CheckCircle',
        description: 'Votre commande a été livrée avec succès.'
      },
      cancelled: {
        label: 'Annulée',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: 'XCircle',
        description: 'Votre commande a été annulée.'
      },
      refunded: {
        label: 'Remboursée',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'RefreshCw',
        description: 'Un remboursement a été effectué pour cette commande.'
      }
    };

    return statusConfig[status];
  }

  // Méthode pour l'annulation par l'utilisateur
  async cancelOrder(
    orderId: string, 
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        return { success: false, message: 'Commande introuvable.' };
      }

      // Vérifier si la commande peut être annulée (seulement si en attente ou en traitement)
      if (order.status !== 'pending' && order.status !== 'processing') {
        return { 
          success: false, 
          message: 'Cette commande ne peut plus être annulée car elle a déjà été expédiée.' 
        };
      }

      return this.updateOrderStatus(orderId, 'cancelled', `Annulée par le client: ${reason}`);
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, message: 'Une erreur est survenue lors de l\'annulation de la commande.' };
    }
  }
  
  // Méthodes pour les rapports et statistiques
  async getOrdersStatistics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
  }> {
    try {
      const orders = await this.getAllOrders();
      
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Compter les commandes par statut
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<OrderStatus, number>);
      
      // S'assurer que tous les statuts sont représentés
      const allStatuses: OrderStatus[] = [
        'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
      ];
      
      allStatuses.forEach(status => {
        if (!ordersByStatus[status]) {
          ordersByStatus[status] = 0;
        }
      });
      
      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus
      };
    } catch (error) {
      console.error('Error getting orders statistics:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          refunded: 0
        }
      };
    }
  }
}

export const orderService = new OrderService();
export type { Order, OrderItem, OrderStatus, OrderStatusHistory, OrderAddress, PaymentInfo };