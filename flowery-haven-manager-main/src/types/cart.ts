// src/types/cart.ts
export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    options?: {
        color?: string;
        size?: string;
        variant?: string;
        [key: string]: any;
    };
}

export interface PromoCode {
    code: string;
    type: 'percentage' | 'fixed' | 'shipping';
    value: number;
    minAmount?: number;
    expiryDate?: Date;
    isActive: boolean;
}

export interface ShippingMethod {
    id: string;
    name: string;
    description: string;
    price: number;
    estimatedDelivery: string;
    isAvailable: boolean;
}

// src/types/order.ts
export type OrderStatus =
    | 'pending'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';

export interface OrderAddress {
    firstName: string;
    lastName: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault?: boolean;
}

export interface PaymentInfo {
    method: 'card' | 'paypal' | 'transfer' | 'cash';
    cardInfo?: {
        lastFour: string;
        brand: string;
    };
    status: 'pending' | 'paid' | 'failed';
    transactionId?: string;
}

export interface OrderItem extends Omit<CartItem, 'id'> {
    // Inclut tous les champs de CartItem sauf 'id'
    orderId: string;
    priceAtPurchase: number;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
    shippingAddress: OrderAddress;
    billingAddress?: OrderAddress;
    paymentInfo: PaymentInfo;
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    promoCodeApplied?: string;
    notes?: string;
    trackingInfo?: {
        carrier: string;
        trackingNumber: string;
        url: string;
    };
}

export interface OrderStatusHistory {
    orderId: string;
    status: OrderStatus;
    timestamp: string;
    note?: string;
    updatedBy?: string;
}

// src/types/quote.ts
export type QuoteStatus =
    | 'pending'
    | 'in_review'
    | 'awaiting_customer'
    | 'accepted'
    | 'rejected'
    | 'expired';

export interface QuoteRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    eventType: string;
    eventDate: string;
    budget: number;
    description: string;
    attachments?: string[];
    status: QuoteStatus;
    createdAt: string;
    updatedAt: string;
    expiresAt?: string;
}

export interface QuoteItem {
    id: string;
    quoteId: string;
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Quote {
    id: string;
    requestId: string;
    userId: string;
    items: QuoteItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: QuoteStatus;
    notes?: string;
    validUntil: string;
    createdAt: string;
    updatedAt: string;
    adminNotes?: string;
}

// src/types/user.ts
export interface UserAddress extends OrderAddress {
    id: string;
    userId: string;
    label?: string; // ex: "Maison", "Bureau", etc.
}