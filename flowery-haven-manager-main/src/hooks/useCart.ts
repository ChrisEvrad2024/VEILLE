// src/hooks/useCart.ts
import { useState, useEffect } from 'react';
import { cartService } from '@/services';

export function useCart() {
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [cartTotal, setCartTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const cartItems = await cartService.getCart();
            setCart(cartItems);
            setCartCount(await cartService.getCartItemCount());
            setCartTotal(await cartService.getCartTotal());
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();

        // Écouter les événements de mise à jour
        const handleCartUpdate = () => fetchCart();
        window.addEventListener('cartUpdated', handleCartUpdate);

        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

    const addToCart = async (productId, quantity = 1) => {
        await cartService.addToCart(productId, quantity);
        await fetchCart();
    };

    const updateQuantity = async (productId, quantity) => {
        await cartService.updateCartItemQuantity(productId, quantity);
        await fetchCart();
    };

    const removeFromCart = async (productId) => {
        await cartService.removeFromCart(productId);
        await fetchCart();
    };

    const clearCart = async () => {
        await cartService.clearCart();
        await fetchCart();
    };

    return {
        cart,
        cartCount,
        cartTotal,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart
    };
}