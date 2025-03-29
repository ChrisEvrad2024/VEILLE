// src/adapters/order-adapter.ts
import { orderService as existingOrderService } from '../services/order.service';
import { Order as ExistingOrder } from '../services/order.service';
import { Order, OrderItem, OrderStatus, OrderAddress } from '@/types/order';

// Fonction pour convertir entre les deux formats d'Order
const convertExistingOrderToNewFormat = (existingOrder: ExistingOrder): Order => {
  return {
    id: existingOrder.id,
    userId: existingOrder.userId,
    items: existingOrder.orderItems.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.imageUrl,
      orderId: existingOrder.id,
      priceAtPurchase: item.price
    })),
    status: existingOrder.status,
    createdAt: existingOrder.orderDate.toISOString(),
    updatedAt: existingOrder.orderDate.toISOString(),
    shippingAddress: existingOrder.shippingAddress as OrderAddress,
    billingAddress: existingOrder.billingAddress as OrderAddress,
    paymentInfo: {
      method: existingOrder.paymentMethod as any,
      status: 'paid'
    },
    subtotal: existingOrder.total,
    shipping: 0,
    discount: 0,
    total: existingOrder.total,
    trackingInfo: existingOrder.trackingNumber ? {
      carrier: 'Standard',
      trackingNumber: existingOrder.trackingNumber,
      url: '#'
    } : undefined
  };
};

// Adaptateur pour le service Order
export const orderAdapter = {
  getOrderById: async (orderId: string): Promise<Order | null> => {
    const existingOrder = await existingOrderService.getOrderById(orderId);
    if (!existingOrder) return null;
    return convertExistingOrderToNewFormat(existingOrder);
  },
  
  getOrdersByUser: async (userId: string): Promise<Order[]> => {
    const existingOrders = await existingOrderService.getUserOrders();
    return existingOrders.map(convertExistingOrderToNewFormat);
  },
  
  getAllOrders: async (): Promise<Order[]> => {
    const existingOrders = await existingOrderService.getAllOrders();
    return existingOrders.map(convertExistingOrderToNewFormat);
  },
  
  createOrder: async (
    shippingAddress: OrderAddress,
    billingAddress: OrderAddress | null = null,
    paymentMethod: string = 'card'
  ): Promise<{ success: boolean; orderId?: string; message: string }> => {
    try {
      const newOrder = await existingOrderService.createOrder(
        shippingAddress.id || '',
        billingAddress?.id || shippingAddress.id || '',
        paymentMethod,
        ''
      );
      
      return {
        success: true,
        orderId: newOrder.id,
        message: 'Votre commande a été créée avec succès.'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Une erreur est survenue'
      };
    }
  },
  
  updateOrderStatus: async (
    orderId: string,
    newStatus: OrderStatus,
    note?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const success = await existingOrderService.updateOrderStatus(orderId, newStatus as any);
      return {
        success,
        message: success ? 'Statut mis à jour avec succès' : 'Échec de la mise à jour'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Une erreur est survenue'
      };
    }
  },
  
  cancelOrder: async (
    orderId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const success = await existingOrderService.cancelOrder(orderId);
      return {
        success,
        message: success ? 'Commande annulée avec succès' : 'Échec de l\'annulation'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Une erreur est survenue'
      };
    }
  },
  
  // Ajout de fonctionnalités manquantes nécessaires pour nos composants
  getOrderStatusHistory: async (orderId: string) => {
    // Simuler un historique minimal
    const order = await existingOrderService.getOrderById(orderId);
    if (!order) return [];
    
    return [{
      orderId,
      status: order.status,
      timestamp: order.orderDate.toISOString(),
      note: 'Statut actuel'
    }];
  },
  
  getOrderStatusConfig: (status: OrderStatus) => {
    // Fournir la configuration visuelle pour nos composants
    const configs = {
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
    
    return configs[status] || configs.pending;
  },
  
  getOrdersStatistics: async () => {
    // Simuler des statistiques minimales
    const orders = await existingOrderService.getAllOrders();
    
    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length 
        : 0,
      ordersByStatus: {
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        refunded: 0
      }
    };
  }
};