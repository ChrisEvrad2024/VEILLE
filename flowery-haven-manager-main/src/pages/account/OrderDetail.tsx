// src/pages/account/OrderDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  Package, 
  TruckIcon, 
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Download,
  Printer,
  Calendar,
  ArrowLeftRight,
  RefreshCw,
  CheckCircle2,
  User,
  ShieldCheck,
  Shield,
  Users,
  ExternalLink
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { orderService, Order, OrderStatus, OrderStatusHistory } from "@/services/order.service";
import { authService } from "@/services/auth.service";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Chargement de la commande
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        toast.error("ID de commande manquant");
        navigate('/account/orders');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Vérifier l'authentification
        if (!authService.isAuthenticated()) {
          navigate('/auth/login?redirect=/order-detail/' + orderId);
          return;
        }
        
        const orderData = await orderService.getOrderById(orderId);
        
        if (!orderData) {
          toast.error("Commande introuvable");
          navigate('/account/orders');
          return;
        }
        
        setOrder(orderData);
        
        // Charger l'historique des statuts
        const history = await orderService.getOrderStatusHistory(orderId);
        setStatusHistory(history);
      } catch (error) {
        console.error('Error loading order:', error);
        toast.error('Erreur lors du chargement de la commande');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrder();
  }, [orderId, navigate]);
  
  // Formatter la date
  const formatDate = (dateString: string) => {
    const options = { 
      day: 'numeric' as const, 
      month: 'long' as const, 
      year: 'numeric' as const,
      hour: 'numeric' as const,
      minute: 'numeric' as const
    };
    return new Intl.DateTimeFormat('fr-FR', options).format(new Date(dateString));
  };
  
  // Fonction pour annuler la commande
  const cancelOrder = async () => {
    if (!orderId) return;
    
    if (!cancellationReason.trim()) {
      toast.error("Veuillez indiquer une raison d'annulation");
      return;
    }
    
    setIsCancelling(true);
    
    try {
      const result = await orderService.cancelOrder(
        orderId, 
        cancellationReason
      );
      
      if (result.success) {
        setDialogOpen(false);
        
        toast.success("Commande annulée", {
          description: "Votre commande a été annulée avec succès",
          duration: 3000
        });
        
        // Recharger la commande
        const updatedOrder = await orderService.getOrderById(orderId);
        if (updatedOrder) {
          setOrder(updatedOrder);
          
          // Mettre à jour l'historique des statuts
          const history = await orderService.getOrderStatusHistory(orderId);
          setStatusHistory(history);
        }
      } else {
        toast.error("Erreur", {
          description: result.message,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error("Une erreur est survenue lors de l'annulation");
    } finally {
      setIsCancelling(false);
      setCancellationReason("");
    }
  };
  
  // Simuler l'impression de la facture
  const printInvoice = () => {
    if (order?.status === 'pending' || order?.status === 'processing') {
      toast.info("La facture sera disponible une fois la commande traitée", {
        description: "Vous pourrez télécharger votre facture prochainement"
      });
    } else {
      toast.success("Téléchargement de la facture", {
        description: "Votre facture est en cours de téléchargement"
      });
    }
  };
  
  // Simuler la récommande
  const reorder = () => {
    toast.success("Articles ajoutés au panier", {
      description: "Les articles de cette commande ont été ajoutés à votre panier"
    });
    
    // Rediriger vers le panier
    setTimeout(() => {
      navigate('/cart');
    }, 1500);
  };
  
  // Obtenir le composant d'icône pour le statut
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock size={18} />;
      case 'processing':
        return <Package size={18} />;
      case 'shipped':
        return <TruckIcon size={18} />;
      case 'delivered':
        return <CheckCircle size={18} />;
      case 'cancelled':
        return <AlertCircle size={18} />;
      case 'refunded':
        return <ArrowLeftRight size={18} />;
      default:
        return <Clock size={18} />;
    }
  };
  
  // Obtenir la configuration pour un statut
  const getStatusConfig = (status: OrderStatus) => {
    return orderService.getOrderStatusConfig(status);
  };
  
  // Générer une date de livraison estimée
  const getEstimatedDeliveryDate = () => {
    if (!order) return '';
    
    const createdAt = new Date(order.createdAt);
    
    // Ajouter 3 jours ouvrés pour la livraison standard
    const deliveryDate = new Date(createdAt);
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(deliveryDate);
  };
  
  // Affichage des chargements
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-16 min-h-screen">
          <div className="container max-w-4xl mx-auto px-4 lg:px-8">
            <div className="flex items-center mb-6">
              <Skeleton className="h-9 w-24 mr-4" />
              <Skeleton className="h-6 w-64" />
            </div>
            
            <div className="space-y-8">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-16 w-16 rounded-md" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  // Si la commande n'existe pas
  if (!order) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-16 min-h-screen">
          <div className="container max-w-4xl mx-auto px-4 lg:px-8 text-center">
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6 inline-block">
              <Package size={32} />
            </div>
            <h1 className="text-2xl font-serif mb-4">Commande introuvable</h1>
            <p className="text-muted-foreground mb-8">
              Nous n'avons pas trouvé la commande que vous recherchez. Elle a peut-être été supprimée ou l'identifiant est incorrect.
            </p>
            <Button asChild>
              <Link to="/account/orders">
                Voir mes commandes
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-16 min-h-screen">
        <div className="container max-w-4xl mx-auto px-4 lg:px-8">
          {/* Retour aux commandes */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <Button
              variant="ghost"
              className="mb-4 sm:mb-0 w-fit p-0 h-auto font-normal hover:bg-transparent hover:underline"
              onClick={() => navigate('/account/orders')}
            >
              <ChevronLeft size={16} className="mr-1" />
              Retour aux commandes
            </Button>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={printInvoice}
                className="gap-1"
              >
                <Download size={14} />
                Facture
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={reorder}
                className="gap-1"
              >
                <RefreshCw size={14} />
                Commander à nouveau
              </Button>
              
              {(order.status === 'pending' || order.status === 'processing') && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                    >
                      <AlertCircle size={14} />
                      Annuler
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Annuler la commande</DialogTitle>
                      <DialogDescription>
                        Vous êtes sur le point d'annuler votre commande #{orderId?.substring(0, 8).toUpperCase()}. Cette action est irréversible.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <label className="text-sm font-medium mb-2 block">
                        Raison de l'annulation
                      </label>
                      <Textarea
                        placeholder="Veuillez indiquer la raison de votre annulation..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={cancelOrder}
                        disabled={isCancelling}
                      >
                        {isCancelling ? "Traitement..." : "Confirmer l'annulation"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          {/* En-tête de la commande */}
          <div className="mb-8">
            <h1 className="text-2xl font-serif flex items-center gap-2 mb-1">
              Commande #{orderId?.substring(0, 8).toUpperCase()}
              <Badge 
                variant="outline"
                className={`
                  ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                  ${order.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                  ${order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                  ${order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                  ${order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                  ${order.status === 'refunded' ? 'bg-gray-100 text-gray-800 border-gray-200' : ''}
                `}
              >
                {getStatusConfig(order.status).label}
              </Badge>
            </h1>
            <p className="text-muted-foreground flex items-center">
              <Calendar size={16} className="mr-2" />
              Commandé le {formatDate(order.createdAt)}
            </p>
          </div>
          
          <div className="space-y-8">
            {/* Carte principale avec statut, adresses et paiement */}
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Suivi de la progression */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-4">Statut de la commande</h3>
                  <div className="relative">
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted -z-10"></div>
                    <div 
                      className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500 -z-10"
                      style={{ 
                        width: 
                          order.status === 'pending' ? '0%' : 
                          order.status === 'processing' ? '25%' : 
                          order.status === 'shipped' ? '50%' : 
                          order.status === 'delivered' ? '100%' : 
                          order.status === 'cancelled' ? '100%' : 
                          '100%' 
                      }}
                    ></div>
                    
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center text-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${order.status !== 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                        `}>
                          <Clock size={16} />
                        </div>
                        <span className="text-xs mt-2">Reçue</span>
                      </div>
                      
                      <div className="flex flex-col items-center text-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${order.status !== 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                        `}>
                          <Package size={16} />
                        </div>
                        <span className="text-xs mt-2">En cours</span>
                      </div>
                      
                      <div className="flex flex-col items-center text-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                        `}>
                          <TruckIcon size={16} />
                        </div>
                        <span className="text-xs mt-2">Expédiée</span>
                      </div>
                      
                      <div className="flex flex-col items-center text-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${order.status === 'delivered' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                        `}>
                          <CheckCircle size={16} />
                        </div>
                        <span className="text-xs mt-2">Livrée</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Message de statut */}
                  <div className="mt-4 text-sm">
                    <div className="flex items-start">
                      {getStatusIcon(order.status)}
                      <div className="ml-2">
                        <p className="font-medium">{getStatusConfig(order.status).label}</p>
                        <p className="text-muted-foreground">{getStatusConfig(order.status).description}</p>
                        
                        {order.status === 'shipped' && order.trackingInfo && (
                          <a 
                            href={order.trackingInfo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center mt-1"
                          >
                            <span>Suivi de livraison {order.trackingInfo.carrier}</span>
                            <ExternalLink size={12} className="ml-1" />
                          </a>
                        )}
                        
                        {order.status === 'pending' && (
                          <p className="text-muted-foreground mt-1">Livraison estimée: <span className="font-medium">{getEstimatedDeliveryDate()}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Informations sur l'adresse et le paiement */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <MapPin size={14} className="mr-1" />
                      Adresse de livraison
                    </h3>
                    <div className="text-sm">
                      <p className="font-medium">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.address}
                        {order.shippingAddress.address2 && <>, {order.shippingAddress.address2}</>}
                      </p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.postalCode} {order.shippingAddress.city}, {order.shippingAddress.state}
                      </p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.country}
                      </p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <CreditCard size={14} className="mr-1" />
                      Méthode de paiement
                    </h3>
                    <div className="text-sm">
                      <p className="font-medium">
                        {order.paymentInfo.method === 'card' && 'Carte bancaire'}
                        {order.paymentInfo.method === 'paypal' && 'PayPal'}
                        {order.paymentInfo.method === 'transfer' && 'Virement bancaire'}
                        {order.paymentInfo.method === 'cash' && 'Paiement à la livraison'}
                      </p>
                      
                      {order.paymentInfo.method === 'card' && order.paymentInfo.cardInfo && (
                        <p className="text-muted-foreground">
                          {order.paymentInfo.cardInfo.brand} se terminant par {order.paymentInfo.cardInfo.lastFour}
                        </p>
                      )}
                      
                      <p className="text-muted-foreground mt-1">
                        Statut: <span className={`
                          ${order.paymentInfo.status === 'paid' ? 'text-green-600' : 
                           order.paymentInfo.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}
                        `}>
                          {order.paymentInfo.status === 'paid' ? 'Payé' : 
                           order.paymentInfo.status === 'pending' ? 'En attente' : 'Échoué'}
                        </span>
                      </p>
                      
                      {order.paymentInfo.transactionId && (
                        <p className="text-muted-foreground">
                          Transaction: {order.paymentInfo.transactionId}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <User size={14} className="mr-1" />
                      Adresse de facturation
                    </h3>
                    <div className="text-sm">
                      <p className="font-medium">
                        {order.billingAddress?.firstName || order.shippingAddress.firstName} {order.billingAddress?.lastName || order.shippingAddress.lastName}
                      </p>
                      <p className="text-muted-foreground">
                        {order.billingAddress?.address || order.shippingAddress.address}
                        {(order.billingAddress?.address2 || order.shippingAddress.address2) && <>, {order.billingAddress?.address2 || order.shippingAddress.address2}</>}
                      </p>
                      <p className="text-muted-foreground">
                        {order.billingAddress?.postalCode || order.shippingAddress.postalCode} {order.billingAddress?.city || order.shippingAddress.city}, {order.billingAddress?.state || order.shippingAddress.state}
                      </p>
                      <p className="text-muted-foreground">
                        {order.billingAddress?.country || order.shippingAddress.country}
                      </p>
                      <p className="text-muted-foreground">
                        {order.billingAddress?.phone || order.shippingAddress.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Onglets Articles et Historique */}
            <Tabs defaultValue="items">
              <TabsList className="mb-6">
                <TabsTrigger value="items">Articles commandés</TabsTrigger>
                <TabsTrigger value="history">Historique de la commande</TabsTrigger>
              </TabsList>
              
              {/* Onglet Articles */}
              <TabsContent value="items">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Détails des articles</CardTitle>
                    <CardDescription>
                      {order.items.length} article{order.items.length > 1 ? 's' : ''} • {order.items.reduce((total, item) => total + item.quantity, 0)} unité{order.items.reduce((total, item) => total + item.quantity, 0) > 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex p-6">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{item.name}</p>
                              
                              <p className="text-sm text-muted-foreground mt-1">
                                Quantité: {item.quantity}
                              </p>
                              
                              <p className="text-sm text-muted-foreground">
                                Prix unitaire: {item.price.toFixed(2)} XAF
                              </p>
                              
                              {/* Options du produit (si présentes) */}
                              {item.options && Object.keys(item.options).length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {Object.entries(item.options).map(([key, value]) => (
                                    <div key={key} className="flex items-center text-xs text-muted-foreground">
                                      <ChevronLeft size={12} className="mr-1" />
                                      <span className="capitalize">{key}:</span>
                                      <span className="ml-1 font-medium">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium">{(item.price * item.quantity).toFixed(2)} XAF</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30">
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span>{order.subtotal.toFixed(2)} XAF</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span>
                          {order.shipping === 0 
                            ? <span className="text-green-600">Gratuite</span> 
                            : `${order.shipping.toFixed(2)} XAF`
                          }
                        </span>
                      </div>
                      
                      {order.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Réduction</span>
                          <span className="text-green-600">-{order.discount.toFixed(2)} XAF</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between font-medium text-base pt-2">
                        <span>Total</span>
                        <span>{order.total.toFixed(2)} XAF</span>
                      </div>
                      
                      {/* Informations TVA */}
                      <p className="text-xs text-muted-foreground text-right">
                        * Prix TTC. TVA comprise.
                      </p>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Onglet Historique */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Historique de la commande</CardTitle>
                    <CardDescription>
                      Suivi de l'évolution de votre commande
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {statusHistory.length > 0 ? (
                        <ul className="space-y-4 relative">
                          {/* Ligne verticale */}
                          <div className="absolute left-3 top-3 bottom-3 w-px bg-muted-foreground/20"></div>
                          
                          {statusHistory.map((status, index) => (
                            <li key={index} className="pl-8 relative">
                              {/* Cercle pour chaque étape */}
                              <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center z-10">
                                {getStatusIcon(status.status)}
                              </div>
                              
                              <p className="font-medium text-sm">
                                {getStatusConfig(status.status).label}
                              </p>
                              <time className="text-sm text-muted-foreground mb-1 block">
                                {formatDate(status.timestamp)}
                              </time>
                              {status.note && (
                                <p className="text-sm text-muted-foreground">
                                  {status.note}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-8">
                          <History size={32} className="text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">Aucun historique disponible</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Section d'aide */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="help">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center">
                    <Users size={16} className="mr-2" />
                    <span>Besoin d'aide avec cette commande ?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-2">
                    <p className="text-sm text-muted-foreground">
                      Notre équipe de service client est disponible pour vous aider avec toutes vos questions concernant cette commande.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                        <Mail size={18} className="mb-2 text-primary" />
                        <h4 className="font-medium mb-1">Par email</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Réponse sous 24h
                        </p>
                        <a href="mailto:support@ChezFLORA.com" className="text-sm text-primary hover:underline">
                          support@ChezFLORA.com
                        </a>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                        <Phone size={18} className="mb-2 text-primary" />
                        <h4 className="font-medium mb-1">Par téléphone</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Lun-Ven, 9h à 18h
                        </p>
                        <a href="tel:+237612345678" className="text-sm text-primary hover:underline">
                          +237 612 345 678
                        </a>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                        <ShieldCheck size={18} className="mb-2 text-primary" />
                        <h4 className="font-medium mb-1">Garantie</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Protection client
                        </p>
                        <a href="#" className="text-sm text-primary hover:underline">
                          Politique de garantie
                        </a>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Actions supplémentaires */}
            <div className="flex flex-wrap gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => navigate('/account/orders')}
                    >
                      <ShoppingBag size={14} />
                      Mes commandes
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Voir toutes vos commandes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={printInvoice}
                    >
                      <Printer size={14} />
                      Imprimer
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Imprimer les détails de la commande</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={reorder}
                    >
                      <RefreshCw size={14} />
                      Commander à nouveau
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ajouter tous les articles au panier</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderDetail;