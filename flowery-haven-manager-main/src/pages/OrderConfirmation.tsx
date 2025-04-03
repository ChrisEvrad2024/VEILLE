// src/pages/OrderConfirmation.tsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { orderService, Order } from "@/services/order.service";
import { authService } from "@/services/auth.service";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Calendar,
  Mail,
  Phone,
  Printer,
  Download,
  Copy,
  MapPin,
  ShoppingBag,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        toast.error("ID de commande manquant");
        navigate("/account/orders");
        return;
      }

      setIsLoading(true);

      try {
        // Vérifier l'authentification
        if (!authService.isAuthenticated()) {
          navigate("/auth/login?redirect=/order-confirmation/" + orderId);
          return;
        }

        const orderData = await orderService.getOrderById(orderId);

        if (!orderData) {
          toast.error("Commande introuvable");
          navigate("/account/orders");
          return;
        }

        setOrder(orderData);
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error("Erreur lors du chargement de la commande");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId, navigate]);

  // Fonction pour copier le numéro de commande
  const copyOrderNumber = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      toast.success("Numéro de commande copié dans le presse-papiers");
    }
  };

  // Fonction pour simuler l'impression de la facture
  const printInvoice = () => {
    toast.success("La facture sera disponible une fois la commande traitée", {
      description:
        "Vous pourrez télécharger votre facture dans votre espace client",
    });
  };

  // Afficher un chargement si les données sont en cours de chargement
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-16 min-h-screen">
          <div className="container max-w-3xl mx-auto px-4 lg:px-8">
            <div className="space-y-8">
              <div className="text-center">
                <Skeleton className="h-8 w-64 mx-auto mb-2" />
                <Skeleton className="h-4 w-full max-w-md mx-auto" />
              </div>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
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

                  <Separator />

                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
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

  // Si aucune commande n'est trouvée
  if (!order) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-16 min-h-screen">
          <div className="container max-w-3xl mx-auto px-4 lg:px-8 text-center">
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6 inline-block">
              <Clock size={32} />
            </div>
            <h1 className="text-2xl font-serif mb-4">Commande introuvable</h1>
            <p className="text-muted-foreground mb-8">
              Nous n'avons pas trouvé la commande que vous recherchez. Elle a
              peut-être été supprimée ou l'identifiant est incorrect.
            </p>
            <Button asChild>
              <Link to="/account/orders">Voir mes commandes</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  // Calculer la date de livraison estimée
  const getEstimatedDeliveryDate = () => {
    const createdAt = new Date(order.createdAt);

    // Ajouter 3-5 jours ouvrés pour la livraison standard
    const deliveryDate = new Date(createdAt);
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(deliveryDate);
  };

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-16 min-h-screen">
        <div className="container max-w-3xl mx-auto px-4 lg:px-8">
          <div className="space-y-8">
            {/* En-tête de confirmation */}
            <div className="text-center">
              <div className="bg-green-100 text-green-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h1 className="text-3xl font-serif mb-2">Commande confirmée</h1>
              <p className="text-muted-foreground">
                Merci pour votre commande ! Nous vous enverrons un email de
                confirmation à{" "}
                <strong>
                  {order.paymentInfo.method === "card"
                    ? "contact@example.com"
                    : order.shippingAddress.email || "votre adresse email"}
                </strong>
                .
              </p>
            </div>

            {/* Carte principale de la commande */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      Commande #{orderId?.substring(0, 8).toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      Passée le {formatDate(order.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`
                      ${
                        order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : ""
                      }
                      ${
                        order.status === "processing"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : ""
                      }
                      ${
                        order.status === "shipped"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : ""
                      }
                      ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : ""
                      }
                      ${
                        order.status === "cancelled"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : ""
                      }
                    `}
                  >
                    {orderService.getOrderStatusConfig(order.status).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informations de livraison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Adresse de livraison
                    </h3>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">
                        {order.shippingAddress.firstName}{" "}
                        {order.shippingAddress.lastName}
                      </p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.address}
                        {order.shippingAddress.address2 && (
                          <>, {order.shippingAddress.address2}</>
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.postalCode}{" "}
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}
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
                    <h3 className="text-sm font-medium mb-2">
                      Détails de la commande
                    </h3>
                    <div className="text-sm space-y-2">
                      <div className="flex">
                        <Clock
                          size={16}
                          className="mr-2 text-muted-foreground"
                        />
                        <div>
                          <span className="text-muted-foreground">Statut:</span>
                          <span className="ml-2 font-medium">
                            {
                              orderService.getOrderStatusConfig(order.status)
                                .label
                            }
                          </span>
                        </div>
                      </div>

                      <div className="flex">
                        <Calendar
                          size={16}
                          className="mr-2 text-muted-foreground"
                        />
                        <div>
                          <span className="text-muted-foreground">
                            Livraison estimée:
                          </span>
                          <span className="ml-2 font-medium">
                            {getEstimatedDeliveryDate()}
                          </span>
                        </div>
                      </div>

                      <div className="flex">
                        <CreditCard
                          size={16}
                          className="mr-2 text-muted-foreground"
                        />
                        <div>
                          <span className="text-muted-foreground">
                            Méthode de paiement:
                          </span>
                          <span className="ml-2 font-medium">
                            {order.paymentInfo.method === "card" &&
                              "Carte bancaire"}
                            {order.paymentInfo.method === "paypal" && "PayPal"}
                            {order.paymentInfo.method === "transfer" &&
                              "Virement bancaire"}
                            {order.paymentInfo.method === "cash" &&
                              "Paiement à la livraison"}
                          </span>
                        </div>
                      </div>

                      {order.trackingInfo && (
                        <div className="flex">
                          <MapPin
                            size={16}
                            className="mr-2 text-muted-foreground"
                          />
                          <div>
                            <span className="text-muted-foreground">
                              Suivi:
                            </span>
                            <a
                              href={order.trackingInfo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 font-medium text-primary hover:underline"
                            >
                              {order.trackingInfo.carrier} -{" "}
                              {order.trackingInfo.trackingNumber}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Articles commandés */}
                <div>
                  <h3 className="text-sm font-medium mb-4">
                    Articles commandés
                  </h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantité: {item.quantity} × {item.price.toFixed(2)}{" "}
                            XAF
                          </p>

                          {/* Options du produit (si présentes) */}
                          {item.options &&
                            Object.keys(item.options).length > 0 && (
                              <div className="mt-1 space-y-1">
                                {Object.entries(item.options).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex items-center text-xs text-muted-foreground"
                                    >
                                      <ChevronRight
                                        size={12}
                                        className="mr-1"
                                      />
                                      <span className="capitalize">{key}:</span>
                                      <span className="ml-1 font-medium">
                                        {value}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {(item.price * item.quantity).toFixed(2)} XAF
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Résumé des coûts */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{order.subtotal.toFixed(2)} XAF</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>
                      {order.shipping === 0 ? (
                        <span className="text-green-600">Gratuite</span>
                      ) : (
                        `${order.shipping.toFixed(2)} XAF`
                      )}
                    </span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Réduction</span>
                      <span className="text-green-600">
                        -{order.discount.toFixed(2)} XAF
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-medium text-base pt-2">
                    <span>Total</span>
                    <span>{order.total.toFixed(2)} XAF</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <div className="flex flex-wrap gap-3 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={copyOrderNumber}
                  >
                    <Copy size={16} className="mr-2" />
                    Copier n° commande
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={printInvoice}
                  >
                    <Printer size={16} className="mr-2" />
                    Imprimer facture
                  </Button>
                </div>

                <div className="flex flex-col w-full gap-2">
                  <Button asChild className="w-full">
                    <Link to="/account/orders">
                      <ShoppingBag size={16} className="mr-2" />
                      Voir mes commandes
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild className="w-full">
                    <Link to="/catalog">
                      Continuer mes achats
                      <ArrowUpRight size={16} className="ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Section d'aide */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Besoin d'aide ?</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-3">
                    <Mail size={20} className="text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Par email</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Contactez notre service client
                  </p>
                  <a
                    href="mailto:support@ChezFLORA.com"
                    className="text-sm text-primary hover:underline"
                  >
                    support@ChezFLORA.com
                  </a>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-3">
                    <Phone size={20} className="text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Par téléphone</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Lun-Ven, 9h à 18h
                  </p>
                  <a
                    href="tel:+237612345678"
                    className="text-sm text-primary hover:underline"
                  >
                    +237 612 345 678
                  </a>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-primary/10 p-3 mb-3">
                    <Download size={20} className="text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">FAQ</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Consultez notre aide en ligne
                  </p>
                  <a
                    href="/faq"
                    className="text-sm text-primary hover:underline"
                  >
                    Voir la FAQ
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderConfirmation;
