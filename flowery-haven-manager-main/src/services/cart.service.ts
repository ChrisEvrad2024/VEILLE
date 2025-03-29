// src/services/cart.service.ts
import { v4 as uuidv4 } from 'uuid';
import { dbService } from './db.service';
import { authService } from './auth.service';
import { productService } from './product.service';

// Types and Interfaces
export interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  stock: number;
  category: string;
  popular: boolean;
  featured: boolean;
}

export interface CartItem {
  id: string;
  userId?: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  dateAdded: Date;
  options?: Record<string, any>;
  product?: Product;
}

export interface PromoCode {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
  isActive: boolean;
  expiryDate?: string;
  minAmount?: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDelivery: string;
  isAvailable: boolean;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

/**
 * CartService - Handles all cart operations with support for:
 * - Authenticated and guest users
 * - IndexedDB with localStorage fallback
 * - Promo codes
 * - Shipping methods
 * - Cart calculations
 */
class CartService {
  private readonly storageKey = 'cart';
  private readonly promoStorageKey = 'appliedPromoCode';
  private readonly shippingStorageKey = 'selectedShipping';
  private readonly freeShippingThreshold = 50;

  /**
   * Dispatches a cart updated event to notify components of changes
   */
  private dispatchCartUpdatedEvent(): void {
    window.dispatchEvent(new Event('cartUpdated'));
    this.updateCartCountCache();
  }

  /**
   * Updates the cart count in session storage for faster access
   */
  private async updateCartCountCache(): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const count = await this.getCartItemCount();
      sessionStorage.setItem(`cartCount_${currentUser.id}`, count.toString());
    }
  }

  /**
   * Gets the current user's cart
   */
  async getCart(): Promise<CartItem[]> {
    try {
      const currentUser = authService.getCurrentUser();
      
      // For guest users, use localStorage
      if (!currentUser) {
        return this.getGuestCart();
      }
      
      // For authenticated users, use IndexedDB with localStorage fallback
      try {
        // Get items from IndexedDB directly
        const items = await dbService.getByIndex<CartItem>("cart", "userId", currentUser.id);
        
        if (items && items.length > 0) {
          // Enrich items with product details
          return Promise.all(
            items.map(async item => {
              const product = await productService.getProductById(item.productId);
              return {
                ...item,
                name: product?.name || item.name || "Produit",
                price: product?.price || item.price || 0,
                image: product?.images?.[0] || item.image || "",
                product: product || undefined
              };
            })
          );
        }
        
        // Try to migrate from localStorage if no items in IndexedDB
        const storedCart = localStorage.getItem(this.storageKey);
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart) as CartItem[];
          const userItems = parsedCart.filter(item => 
            !item.userId || item.userId === 'local' || item.userId === currentUser.id
          );
          
          // Transfer to IndexedDB
          for (const item of userItems) {
            const enrichedItem = {
              ...item,
              userId: currentUser.id,
              dateAdded: item.dateAdded ? new Date(item.dateAdded) : new Date()
            };
            await dbService.addItem('cart', enrichedItem);
          }
          
          return userItems;
        }
      } catch (dbError) {
        console.error('Error accessing IndexedDB:', dbError);
        // Fall back to localStorage if IndexedDB fails
        return this.getGuestCart();
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching cart:', error);
      return this.getGuestCart();
    }
  }

  /**
   * Gets the cart for guest users
   */
  private async getGuestCart(): Promise<CartItem[]> {
    try {
      const storedCart = localStorage.getItem(this.storageKey);
      if (!storedCart) return [];
      
      const cartItems = JSON.parse(storedCart) as CartItem[];
      
      // Enrich items with product details where needed
      return Promise.all(
        cartItems.map(async item => {
          if (item.product) return item;
          
          try {
            const product = await productService.getProductById(item.productId);
            return {
              ...item,
              name: product?.name || item.name || "Produit",
              price: product?.price || item.price || 0,
              image: product?.images?.[0] || item.image || "",
              dateAdded: item.dateAdded ? new Date(item.dateAdded) : new Date(),
              product: product || undefined
            };
          } catch (error) {
            // Return item as is if product fetch fails
            return {
              ...item,
              dateAdded: item.dateAdded ? new Date(item.dateAdded) : new Date()
            };
          }
        })
      );
    } catch (error) {
      console.error('Error fetching guest cart:', error);
      return [];
    }
  }

  /**
   * Gets the total number of items in the cart
   */
  async getCartItemCount(): Promise<number> {
    try {
      const items = await this.getCart();
      return items.reduce((count, item) => count + (item.quantity || 1), 0);
    } catch (error) {
      console.error('Error getting cart item count:', error);
      return 0;
    }
  }

  /**
   * Gets the cart count synchronously (for UI components)
   */
  getCartItemCountSync(): number {
    try {
      const currentUser = authService.getCurrentUser();

      // For guest users, use localStorage
      if (!currentUser) {
        const localCart = localStorage.getItem(this.storageKey);
        const cartItems = localCart ? JSON.parse(localCart) as CartItem[] : [];
        return cartItems.reduce((count, item) => count + (item.quantity || 1), 0);
      }

      // For authenticated users, use cached value
      const cachedCount = sessionStorage.getItem(`cartCount_${currentUser.id}`);
      return cachedCount ? parseInt(cachedCount) : 0;
    } catch (error) {
      console.error('Error in getCartItemCountSync:', error);
      return 0;
    }
  }

  /**
   * Gets the subtotal of the cart (before discounts and shipping)
   */
  async getCartSubtotal(): Promise<number> {
    try {
      const items = await this.getCart();
      return items.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
    } catch (error) {
      console.error('Error calculating cart subtotal:', error);
      return 0;
    }
  }

  /**
   * Adds a product to the cart
   */
  async addToCart(
    productOrId: string | Product, 
    quantity: number = 1, 
    options?: Record<string, any>
  ): Promise<CartItem> {
    try {
      let product: Product;
      
      // If a string ID was passed, fetch the product
      if (typeof productOrId === 'string') {
        const fetchedProduct = await productService.getProductById(productOrId);
        if (!fetchedProduct) {
          throw new Error('Product not found');
        }
        product = fetchedProduct;
      } else {
        product = productOrId;
      }

      const currentUser = authService.getCurrentUser();
      const cart = await this.getCart();
      
      // Check if item with same product and options exists
      const existingItemIndex = cart.findIndex(item => 
        item.productId === product.id && 
        JSON.stringify(item.options || {}) === JSON.stringify(options || {})
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItem = {
          ...cart[existingItemIndex],
          quantity: (cart[existingItemIndex].quantity || 1) + quantity
        };
        
        if (currentUser) {
          // For authenticated users, update in IndexedDB
          try {
            await dbService.updateItem('cart', updatedItem);
          } catch (error) {
            console.error('Error updating item in IndexedDB:', error);
            // Fall back to localStorage
            cart[existingItemIndex] = updatedItem;
            localStorage.setItem(this.storageKey, JSON.stringify(cart));
          }
        } else {
          // For guest users, update in localStorage
          cart[existingItemIndex] = updatedItem;
          localStorage.setItem(this.storageKey, JSON.stringify(cart));
        }
        
        this.dispatchCartUpdatedEvent();
        return updatedItem;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: uuidv4(),
          userId: currentUser?.id || 'local',
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.images[0],
          dateAdded: new Date(),
          options,
          product
        };
        
        if (currentUser) {
          // For authenticated users, add to IndexedDB
          try {
            await dbService.addItem('cart', newItem);
          } catch (error) {
            console.error('Error adding item to IndexedDB:', error);
            // Fall back to localStorage
            cart.push(newItem);
            localStorage.setItem(this.storageKey, JSON.stringify(cart));
          }
        } else {
          // For guest users, add to localStorage
          cart.push(newItem);
          localStorage.setItem(this.storageKey, JSON.stringify(cart));
        }
        
        this.dispatchCartUpdatedEvent();
        return newItem;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Updates the quantity of an item in the cart
   */
  async updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItem | null> {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(itemId);
      }
      
      const currentUser = authService.getCurrentUser();
      const cart = await this.getCart();
      const itemIndex = cart.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        return null;
      }
      
      const updatedItem = {
        ...cart[itemIndex],
        quantity
      };
      
      if (currentUser) {
        // For authenticated users, update in IndexedDB
        try {
          await dbService.updateItem('cart', updatedItem);
        } catch (error) {
          console.error('Error updating item in IndexedDB:', error);
          // Fall back to localStorage
          cart[itemIndex] = updatedItem;
          localStorage.setItem(this.storageKey, JSON.stringify(cart));
        }
      } else {
        // For guest users, update in localStorage
        cart[itemIndex] = updatedItem;
        localStorage.setItem(this.storageKey, JSON.stringify(cart));
      }
      
      this.dispatchCartUpdatedEvent();
      return updatedItem;
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      return null;
    }
  }

  /**
   * Removes an item from the cart
   */
  async removeFromCart(itemId: string): Promise<null> {
    try {
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        // For authenticated users, delete from IndexedDB
        try {
          await dbService.deleteItem('cart', itemId);
        } catch (error) {
          console.error('Error removing item from IndexedDB:', error);
          // Fall back to localStorage
          const cart = await this.getCart();
          const updatedCart = cart.filter(item => item.id !== itemId);
          localStorage.setItem(this.storageKey, JSON.stringify(updatedCart));
        }
      } else {
        // For guest users, remove from localStorage
        const cart = await this.getCart();
        const updatedCart = cart.filter(item => item.id !== itemId);
        localStorage.setItem(this.storageKey, JSON.stringify(updatedCart));
      }
      
      this.dispatchCartUpdatedEvent();
      return null;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return null;
    }
  }

  /**
   * Clears the entire cart
   */
  async clearCart(): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        // For authenticated users, clear from IndexedDB
        try {
          const items = await dbService.getByIndex<CartItem>('cart', 'userId', currentUser.id);
          for (const item of items) {
            if (item.id) {
              await dbService.deleteItem('cart', item.id);
            }
          }
        } catch (error) {
          console.error('Error clearing cart in IndexedDB:', error);
        }
      }
      
      // Always clear localStorage
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.promoStorageKey);
      localStorage.removeItem(this.shippingStorageKey);
      
      this.dispatchCartUpdatedEvent();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }

  /**
   * Merges guest cart with user cart after login
   */
  async mergeGuestCartWithUserCart(userId: string): Promise<void> {
    try {
      const localCart = localStorage.getItem(this.storageKey);
      if (!localCart) return;
      
      const cartItems = JSON.parse(localCart) as CartItem[];
      if (cartItems.length === 0) return;
      
      for (const item of cartItems) {
        try {
          // First check if the item already exists in the user's cart
          const userItems = await dbService.getByIndex<CartItem>('cart', 'userId', userId);
          const existingItem = userItems.find(userItem => 
            userItem.productId === item.productId && 
            JSON.stringify(userItem.options || {}) === JSON.stringify(item.options || {})
          );
          
          if (existingItem) {
            // Update quantity if item exists
            await dbService.updateItem('cart', {
              ...existingItem,
              quantity: (existingItem.quantity || 1) + (item.quantity || 1)
            });
          } else {
            // Add as new item
            await dbService.addItem('cart', {
              ...item,
              id: uuidv4(),
              userId,
              dateAdded: new Date()
            });
          }
        } catch (error) {
          console.error('Error merging item:', error);
        }
      }
      
      // Clear localStorage cart after merging
      localStorage.removeItem(this.storageKey);
      
      this.dispatchCartUpdatedEvent();
    } catch (error) {
      console.error('Error merging carts:', error);
    }
  }

  // Promo Code Methods

  /**
   * Gets available promo codes
   */
  async getAvailablePromoCodes(): Promise<PromoCode[]> {
    try {
      return await dbService.getActivePromoCodes();
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      return [];
    }
  }

  /**
   * Applies a promo code to the cart
   */
  async applyPromoCode(code: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find the promo code in the database
      const promoCode = await dbService.get<PromoCode>('promoCodes', code);
      
      if (!promoCode) {
        return { success: false, message: 'Invalid promo code.' };
      }
      
      if (!promoCode.isActive) {
        return { success: false, message: 'This promo code is no longer active.' };
      }
      
      if (promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date()) {
        return { success: false, message: 'This promo code has expired.' };
      }
      
      // Check minimum amount if required
      if (promoCode.minAmount) {
        const subtotal = await this.getCartSubtotal();
        if (subtotal < promoCode.minAmount) {
          return { 
            success: false, 
            message: `This promo code requires a minimum purchase of ${promoCode.minAmount.toFixed(2)}.` 
          };
        }
      }
      
      // Save the applied promo code
      localStorage.setItem(this.promoStorageKey, JSON.stringify(promoCode));
      
      this.dispatchCartUpdatedEvent();
      
      return { success: true, message: 'Promo code applied successfully!' };
    } catch (error) {
      console.error('Error applying promo code:', error);
      return { success: false, message: 'An error occurred while applying the promo code.' };
    }
  }

  /**
   * Removes the applied promo code
   */
  async removePromoCode(): Promise<void> {
    localStorage.removeItem(this.promoStorageKey);
    this.dispatchCartUpdatedEvent();
  }

  /**
   * Gets the currently applied promo code
   */
  async getAppliedPromoCode(): Promise<PromoCode | null> {
    const storedPromo = localStorage.getItem(this.promoStorageKey);
    return storedPromo ? JSON.parse(storedPromo) : null;
  }

  // Shipping Methods

  /**
   * Gets available shipping methods
   */
  async getShippingMethods(): Promise<ShippingMethod[]> {
    // Static shipping methods (could be fetched from API in the future)
    return [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: '3-5 business days',
        price: 5.90,
        estimatedDelivery: '3-5 days',
        isAvailable: true
      },
      {
        id: 'express',
        name: 'Express Shipping',
        description: '1-2 business days',
        price: 9.90,
        estimatedDelivery: '1-2 days',
        isAvailable: true
      },
      {
        id: 'premium',
        name: 'Premium Shipping',
        description: 'Same day delivery',
        price: 14.90,
        estimatedDelivery: 'Today',
        isAvailable: true
      }
    ];
  }

  /**
   * Selects a shipping method
   */
  async selectShippingMethod(methodId: string): Promise<{ success: boolean; message: string }> {
    const methods = await this.getShippingMethods();
    const selectedMethod = methods.find(m => m.id === methodId);
    
    if (!selectedMethod) {
      return { success: false, message: 'Invalid shipping method.' };
    }
    
    if (!selectedMethod.isAvailable) {
      return { success: false, message: 'This shipping method is currently unavailable.' };
    }
    
    localStorage.setItem(this.shippingStorageKey, JSON.stringify(selectedMethod));
    this.dispatchCartUpdatedEvent();
    
    return { success: true, message: 'Shipping method selected.' };
  }

  /**
   * Gets the selected shipping method
   */
  async getSelectedShippingMethod(): Promise<ShippingMethod | null> {
    const storedMethod = localStorage.getItem(this.shippingStorageKey);
    return storedMethod ? JSON.parse(storedMethod) : null;
  }

  /**
   * Gets the shipping cost (considering free shipping promotions)
   */
  async getShippingCost(): Promise<number> {
    const selectedMethod = await this.getSelectedShippingMethod();
    
    if (!selectedMethod) {
      return 0;
    }
    
    // Check if a free shipping promo code is applied
    const promoCode = await this.getAppliedPromoCode();
    if (promoCode && promoCode.type === 'shipping') {
      return 0;
    }
    
    // Check if cart is eligible for free shipping (above threshold)
    const subtotal = await this.getCartSubtotal();
    if (subtotal >= this.freeShippingThreshold) {
      return 0;
    }
    
    return selectedMethod.price || 0;
  }

  /**
   * Calculates the total cart value including discounts and shipping
   */
  async getFinalTotal(): Promise<CartTotals> {
    try {
      const subtotal = await this.getCartSubtotal();
      const shipping = await this.getShippingCost();
      
      // Calculate discount
      let discount = 0;
      const promoCode = await this.getAppliedPromoCode();
      
      if (promoCode) {
        if (promoCode.type === 'percentage') {
          discount = subtotal * ((promoCode.value || 0) / 100);
        } else if (promoCode.type === 'fixed') {
          discount = Math.min(subtotal, promoCode.value || 0); // Discount can't exceed subtotal
        }
      }
      
      const total = Math.max(0, subtotal + shipping - discount);
      
      return {
        subtotal,
        shipping,
        discount,
        total
      };
    } catch (error) {
      console.error('Error calculating final total:', error);
      return {
        subtotal: 0,
        shipping: 0,
        discount: 0,
        total: 0
      };
    }
  }
}

export const cartService = new CartService();