import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cartService, CartItem } from '@/services/cart.service';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { toast } from "sonner";

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Charger le panier
  const loadCart = async () => {
    setIsLoading(true);
    try {
      const items = await cartService.getCart();
      setCartItems(items);
      
      const total = await cartService.getCartTotal();
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Erreur lors du chargement du panier');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadCart();
    
    // Écouter les mises à jour du panier
    const handleCartUpdate = () => {
      loadCart();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);
  
  // Gérer le changement de quantité
  const handleQuantityChange = async (id: string, newQuantity: number) => {
    try {
      await cartService.updateCartItemQuantity(id, newQuantity);
      // Le panier sera rechargé via l'événement 'cartUpdated'
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      toast.error('Erreur lors de la modification de la quantité');
    }
  };
  
  // Supprimer un article du panier
  const handleRemoveItem = async (id: string) => {
    try {
      await cartService.removeFromCart(id);
      // Le panier sera rechargé via l'événement 'cartUpdated'
      toast.info("Produit retiré", {
        description: "Le produit a été retiré de votre panier",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
  };
  
  // Simuler le passage au paiement
  const proceedToCheckout = () => {
    toast.success("Simulation de commande", {
      description: "Dans une version complète, cette action vous dirigerait vers le processus de paiement.",
      duration: 5000,
    });
  };
  
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-16 min-h-screen">
        <div className="section-container">
          <h1 className="text-3xl font-serif mb-8">Votre Panier</h1>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex justify-center items-center p-6 bg-muted rounded-full mb-6">
                <ShoppingBag size={32} className="text-muted-foreground" />
              </div>
              <h2 className="text-xl font-serif mb-4">Votre panier est vide</h2>
              <p className="text-muted-foreground mb-8">Ajoutez des produits à votre panier pour continuer vos achats.</p>
              <Link to="/catalog" className="btn-primary inline-flex">
                Continuer mes achats
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-background rounded-lg border border-border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left py-4 px-6">Produit</th>
                        <th className="text-center py-4 px-2">Quantité</th>
                        <th className="text-right py-4 px-6">Prix</th>
                        <th className="text-right py-4 px-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.id} className="border-t border-border">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Link to={`/product/${item.productId}`} className="w-20 h-20 rounded-md overflow-hidden bg-muted">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </Link>
                              <div>
                                <Link to={`/product/${item.productId}`} className="font-medium hover:text-primary transition-colors">
                                  {item.name}
                                </Link>
                                <p className="text-muted-foreground text-sm mt-1">{item.price.toFixed(2)} XAF / unité</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center justify-center">
                              <button 
                                className="border border-border rounded-l-md p-2 hover:bg-muted transition-colors"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              >
                                <Minus size={14} />
                              </button>
                              <div className="border-t border-b border-border px-4 py-1.5 flex items-center justify-center min-w-[40px]">
                                {item.quantity}
                              </div>
                              <button 
                                className="border border-border rounded-r-md p-2 hover:bg-muted transition-colors"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-medium">
                            {(item.price && item.quantity ? (item.price * item.quantity).toFixed(2) : '0.00')} XAF
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button 
                              className="text-muted-foreground hover:text-destructive p-2 transition-colors rounded-full hover:bg-muted"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-background rounded-lg border border-border p-6">
                  <h2 className="text-xl font-serif mb-6">Récapitulatif</h2>
                  
                  <div className="space-y-4 border-b border-border pb-6 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span className="font-medium">{totalAmount.toFixed(2)} XAF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison</span>
                      <span className="font-medium">7.90 XAF</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-8">
                    <span className="text-lg">Total</span>
                    <span className="text-lg font-medium">{(totalAmount + 7.9).toFixed(2)} XAF</span>
                  </div>
                  
                  <button 
                    className="btn-primary w-full"
                    onClick={proceedToCheckout}
                    disabled={cartItems.length === 0}
                  >
                    Passer au paiement
                  </button>
                  
                  <div className="mt-6">
                    <Link 
                      to="/catalog" 
                      className="text-primary hover:underline text-sm flex justify-center"
                    >
                      Continuer vos achats
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Cart;