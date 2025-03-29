// src/pages/Cart.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cartService, CartItem, PromoCode, ShippingMethod } from '@/services/cart.service';
import { Minus, Plus, X, ShoppingBag, CornerDownRight, Check, Info, CreditCard, Shield } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authService } from '@/services/auth.service';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    shipping: 0,
    discount: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCode | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Charger le panier
  const loadCart = async () => {
    setIsLoading(true);
    try {
      const items = await cartService.getCart();
      setCartItems(items);
      
      const totals = await cartService.getFinalTotal();
      setTotals(totals);
      
      // Charger le code promo appliqué
      const promo = await cartService.getAppliedPromoCode();
      setAppliedPromoCode(promo);
      
      // Charger les méthodes de livraison
      const methods = await cartService.getShippingMethods();
      setShippingMethods(methods);
      
      // Charger la méthode de livraison sélectionnée
      const selected = await cartService.getSelectedShippingMethod();
      setSelectedShippingMethod(selected);
      
      // Vérifier l'authentification
      setIsAuthenticated(authService.isAuthenticated());
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
  
  // Appliquer un code promo
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Veuillez entrer un code promo");
      return;
    }
    
    setApplyingPromo(true);
    
    try {
      const result = await cartService.applyPromoCode(promoCode);
      
      if (result.success) {
        toast.success("Code promo appliqué", {
          description: result.message,
          duration: 3000,
        });
        setPromoCode('');
        // Le panier sera rechargé automatiquement
      } else {
        toast.error("Erreur", {
          description: result.message,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast.error('Erreur lors de l\'application du code promo');
    } finally {
      setApplyingPromo(false);
    }
  };
  
  // Retirer un code promo
  const handleRemovePromoCode = async () => {
    try {
      await cartService.removePromoCode();
      toast.info("Code promo retiré", {
        description: "Le code promo a été retiré de votre panier",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error removing promo code:', error);
      toast.error('Erreur lors de la suppression du code promo');
    }
  };
  
  // Sélectionner une méthode de livraison
  const handleSelectShippingMethod = async (methodId: string) => {
    try {
      const result = await cartService.selectShippingMethod(methodId);
      
      if (result.success) {
        // La mise à jour du panier se fera automatiquement
      } else {
        toast.error("Erreur", {
          description: result.message,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error selecting shipping method:', error);
      toast.error('Erreur lors de la sélection de la méthode de livraison');
    }
  };
  
  // Procéder au paiement
  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }
    
    if (!selectedShippingMethod) {
      toast.error("Veuillez sélectionner une méthode de livraison");
      return;
    }
    
    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter pour continuer", {
        description: "Vous allez être redirigé vers la page de connexion",
        duration: 3000,
      });
      
      // Rediriger vers la page de connexion avec un retour vers la page de paiement
      setTimeout(() => {
        navigate('/auth/login?redirect=/checkout');
      }, 2000);
      
      return;
    }
    
    // Rediriger vers la page de paiement
    navigate('/checkout');
  };
  
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-16 min-h-screen">
        <div className="container max-w-7xl mx-auto px-4 lg:px-8">
          <h1 className="text-3xl font-serif mb-2">Votre Panier</h1>
          <p className="text-muted-foreground mb-8">
            Vérifiez vos articles et procédez au paiement quand vous êtes prêt.
          </p>
          
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="bg-muted/30">
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex py-4 space-x-4">
                        <Skeleton className="h-20 w-20 rounded-md" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-10 w-full mt-4" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex justify-center items-center p-6 bg-muted rounded-full mb-6">
                <ShoppingBag size={32} className="text-muted-foreground" />
              </div>
              <h2 className="text-xl font-serif mb-4">Votre panier est vide</h2>
              <p className="text-muted-foreground mb-8">Ajoutez des produits à votre panier pour continuer vos achats.</p>
              <Button asChild>
                <Link to="/catalog">
                  Découvrir nos produits
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="bg-muted/30 py-4 px-6">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">Articles ({cartItems.length})</CardTitle>
                      <CardDescription className="text-base">
                        {cartItems.reduce((total, item) => total + item.quantity, 0)} unités
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row p-6">
                          <div className="flex items-start space-x-4 flex-1">
                            <Link to={`/product/${item.productId}`} className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link to={`/product/${item.productId}`} className="font-medium hover:text-primary transition-colors line-clamp-2">
                                {item.name}
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.price !== undefined ? item.price.toFixed(2) : '0.00'} XAF / unité
                              </p>
                              
                              {/* Options du produit (si présentes) */}
                              {item.options && Object.keys(item.options).length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {Object.entries(item.options).map(([key, value]) => (
                                    <div key={key} className="flex items-center text-xs text-muted-foreground">
                                      <CornerDownRight size={12} className="mr-1" />
                                      <span className="capitalize">{key}:</span>
                                      <span className="ml-1 font-medium">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 sm:mt-0 sm:ml-4">
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-l-md"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              >
                                <Minus size={14} />
                              </Button>
                              <div className="h-8 px-3 flex items-center justify-center border-y border-input min-w-[40px]">
                                {item.quantity}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-r-md"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              >
                                <Plus size={14} />
                              </Button>
                            </div>
                            
                            <div className="flex items-center ml-4">
                              <span className="font-medium mx-4 whitespace-nowrap">
                                {((item.price || 0) * item.quantity).toFixed(2)} XAF
                              </span>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 p-6 flex flex-col sm:flex-row sm:justify-between gap-4">
                    <div className="flex-1">
                      <Link 
                        to="/catalog" 
                        className="text-primary hover:underline text-sm flex items-center"
                      >
                        <ShoppingBag size={14} className="mr-1" />
                        Continuer vos achats
                      </Link>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => cartService.clearCart()}
                      >
                        Vider le panier
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
                
                {/* Livraison et promotions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Options de livraison */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Livraison</CardTitle>
                      <CardDescription>Choisissez votre méthode de livraison préférée</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={selectedShippingMethod?.id || ''}
                        onValueChange={handleSelectShippingMethod}
                        className="space-y-3"
                      >
                        {shippingMethods.map((method) => (
                          <div
                            key={method.id}
                            className={`flex items-center space-x-2 rounded-lg border p-4 transition-all ${
                              selectedShippingMethod?.id === method.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border'
                            }`}
                          >
                            <RadioGroupItem value={method.id} id={`shipping-${method.id}`} />
                            <Label
                              htmlFor={`shipping-${method.id}`}
                              className="flex flex-1 justify-between cursor-pointer"
                            >
                              <div>
                                <span className="font-medium block">{method.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {method.description}
                                </span>
                              </div>
                              <div className="font-medium">
                                {(method.price || 0) === 0 
                                  ? 'Gratuit' 
                                  : `${(method.price || 0).toFixed(2)} XAF`
                                }
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      {/* Info livraison gratuite */}
                      {totals.subtotal < 50 && (
                        <div className="mt-4 text-sm text-muted-foreground flex items-start">
                          <Info size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                          <p>Ajoutez {(50 - totals.subtotal).toFixed(2)} XAF à votre panier pour bénéficier de la livraison gratuite.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Code promo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Code promo</CardTitle>
                      <CardDescription>Appliquez un code promo à votre commande</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {appliedPromoCode ? (
                        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="inline-flex items-center bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full mb-1">
                                <Check size={10} className="mr-1" />
                                APPLIQUÉ
                              </span>
                              <h4 className="font-medium">{appliedPromoCode.code}</h4>
                              <p className="text-xs text-muted-foreground">
                                {appliedPromoCode.type === 'percentage' 
                                  ? `${appliedPromoCode.value}% de réduction` 
                                  : appliedPromoCode.type === 'fixed'
                                    ? `${(appliedPromoCode.value || 0).toFixed(2)} XAF de réduction`
                                    : 'Livraison gratuite'
                                }
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRemovePromoCode}
                            >
                              Retirer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Entrez votre code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="uppercase"
                          />
                          <Button 
                            onClick={handleApplyPromoCode}
                            disabled={applyingPromo || !promoCode.trim()}
                          >
                            {applyingPromo ? "..." : "Appliquer"}
                          </Button>
                        </div>
                      )}
                      
                      <div className="mt-4 text-xs text-muted-foreground">
                        <p>Les codes promotionnels ne sont pas cumulables.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Informations supplémentaires */}
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="shipping-info">
                        <AccordionTrigger>Informations de livraison</AccordionTrigger>
                        <AccordionContent>
                          <div className="text-sm space-y-3">
                            <p>
                              Notre service de livraison standard est généralement effectué dans un délai de 2 à 3 jours ouvrés. Les commandes passées avant 14h sont préparées le jour même.
                            </p>
                            <p>
                              La livraison express garantit une livraison le lendemain pour toute commande passée avant 14h. La livraison premium vous permet de choisir un créneau horaire de 2h.
                            </p>
                            <p>
                              La livraison est offerte pour toute commande supérieure à 50 XAF.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="returns">
                        <AccordionTrigger>Politique de retour</AccordionTrigger>
                        <AccordionContent>
                          <div className="text-sm space-y-3">
                            <p>
                              Nous offrons une garantie fraîcheur de 7 jours sur tous nos produits floraux. Si vous n'êtes pas satisfait de la qualité de nos fleurs à leur arrivée, veuillez nous contacter dans les 24 heures avec des photos.
                            </p>
                            <p>
                              Pour les articles non floraux, vous disposez d'un délai de 14 jours pour retourner les produits non utilisés dans leur emballage d'origine.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="payment">
                        <AccordionTrigger>Méthodes de paiement</AccordionTrigger>
                        <AccordionContent>
                          <div className="text-sm space-y-3">
                            <p>Nous acceptons les méthodes de paiement suivantes :</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Cartes de crédit (Visa, Mastercard, American Express)</li>
                              <li>PayPal</li>
                              <li>Virement bancaire (pour les commandes professionnelles)</li>
                              <li>Paiement à la livraison (uniquement pour certaines zones)</li>
                            </ul>
                            <p>
                              Toutes les transactions sont sécurisées et vos informations de paiement sont cryptées.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Récapitulatif</CardTitle>
                    <CardDescription>Détails de votre commande</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span>{totals.subtotal.toFixed(2)} XAF</span>
                      </div>
                      
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center">
                            Réduction
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info size={12} className="ml-1 text-muted-foreground/70" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Code promo: {appliedPromoCode?.code}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                          <span className="text-green-600">-{totals.discount.toFixed(2)} XAF</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span>
                          {totals.shipping === 0 
                            ? <span className="text-green-600">Gratuite</span> 
                            : `${totals.shipping.toFixed(2)} XAF`
                          }
                        </span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>{totals.total.toFixed(2)} XAF</span>
                    </div>
                    
                    {/* Informations TVA */}
                    <p className="text-xs text-muted-foreground">
                      * Prix TTC. TVA comprise à 20%.
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button 
                      className="w-full"
                      size="lg"
                      onClick={proceedToCheckout}
                      disabled={cartItems.length === 0 || !selectedShippingMethod}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Passer au paiement
                    </Button>
                    
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Shield className="mr-1 h-3 w-3" />
                      <span>Paiement sécurisé et chiffré</span>
                    </div>
                  </CardFooter>
                </Card>
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