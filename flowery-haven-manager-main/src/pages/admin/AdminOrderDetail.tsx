// src/pages/admin/OrderDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PrintService } from "@/services/print.service";
import {
  ChevronLeft,
  Package,
  TruckIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Download,
  Mail,
  Edit,
  User,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  ArrowUpDown,
  ListChecks,
  Clipboard,
  ClipboardCheck,
  Send,
  ArrowRight,
  Info,
  RefreshCw,
  XCircle,
  FileText,
  MessageSquare,
  ExternalLink,
  History,
  Plus,
} from "lucide-react";
import {
  orderService,
  Order,
  OrderStatus,
  OrderStatusHistory,
} from "@/services/order.service";
import { authService } from "@/services/auth.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const printOrder = () => {
  if (!order) return;

  PrintService.generateInvoice(order);

  toast.success("Impression de la commande", {
    description: "La facture a été générée et téléchargée",
    duration: 3000,
  });
};

const downloadInvoice = () => {
  if (!order) return;

  PrintService.generateInvoice(order);

  toast.success("Téléchargement de la facture", {
    description: "La facture a été générée et téléchargée",
    duration: 3000,
  });
};

const downloadPackingSlip = () => {
  if (!order) return;

  PrintService.generatePackingSlip(order);

  toast.success("Téléchargement du bordereau", {
    description: "Le bordereau d'expédition a été généré et téléchargé",
    duration: 3000,
  });
};

const AdminOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // États pour les actions
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // États pour le suivi
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({
    carrier: "",
    trackingNumber: "",
    url: "",
  });

  // États pour l'email
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // États pour les notes
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  // Chargement de la commande
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        toast.error("ID de commande manquant");
        navigate("/admin/orders");
        return;
      }

      setIsLoading(true);

      try {
        // Vérifier si l'utilisateur est un administrateur
        if (!authService.isAuthenticated() || !authService.isAdmin()) {
          navigate("/auth/login?redirect=/admin/orders/" + orderId);
          return;
        }

        // Charger la commande
        const orderData = await orderService.getOrderById(orderId);

        if (!orderData) {
          toast.error("Commande introuvable");
          navigate("/admin/orders");
          return;
        }

        setOrder(orderData);

        // Initialiser le statut par défaut
        setNewStatus(orderData.status);

        // Pré-remplir les informations de suivi
        if (orderData.trackingInfo) {
          setTrackingInfo(orderData.trackingInfo);
        }

        // Pré-remplir les notes administratives
        if (orderData.notes) {
          setAdminNote(orderData.notes);
        }

        // Charger l'historique des statuts
        const history = await orderService.getOrderStatusHistory(orderId);
        setStatusHistory(history);

        // Pré-remplir l'e-mail
        setEmailSubject(
          `Information sur votre commande #${orderId
            .substring(0, 8)
            .toUpperCase()}`
        );
        setEmailBody(`Cher/Chère ${orderData.shippingAddress.firstName},

Nous vous contactons au sujet de votre commande #${orderId
          .substring(0, 8)
          .toUpperCase()} passée le ${formatDate(orderData.createdAt)}.

[Votre message ici]

N'hésitez pas à nous contacter si vous avez des questions.

Cordialement,
L'équipe de Floralie`);
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error("Erreur lors du chargement de la commande");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId, navigate]);

  // Formatter la date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(dateString));
  };

  // Obtenir la configuration pour un statut
  const getStatusConfig = (status: OrderStatus) => {
    return orderService.getOrderStatusConfig(status);
  };

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async () => {
    if (!order) return;

    setIsUpdatingStatus(true);

    try {
      const result = await orderService.updateOrderStatus(
        order.id,
        newStatus,
        statusNote
      );

      if (result.success) {
        toast.success("Statut mis à jour", {
          description: `La commande a été mise à jour avec succès.`,
          duration: 3000,
        });

        // Recharger la commande
        const updatedOrder = await orderService.getOrderById(order.id);
        if (updatedOrder) {
          setOrder(updatedOrder);
        }

        // Recharger l'historique des statuts
        const history = await orderService.getOrderStatusHistory(order.id);
        setStatusHistory(history);

        setStatusDialogOpen(false);
      } else {
        toast.error("Erreur", {
          description: result.message,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Une erreur est survenue lors de la mise à jour du statut");
    } finally {
      setIsUpdatingStatus(false);
      setStatusNote("");
    }
  };

  // Mettre à jour les informations de suivi
  const updateTrackingInfo = async () => {
    if (!order) return;

    // Vérifier que les champs obligatoires sont remplis
    if (!trackingInfo.carrier || !trackingInfo.trackingNumber) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      // Dans une application réelle, vous auriez un endpoint API pour mettre à jour les infos de suivi
      // Ici, nous allons simuler la mise à jour
      toast.success("Informations de suivi mises à jour", {
        description:
          "Les informations de suivi ont été mises à jour et le client a été notifié par email.",
        duration: 3000,
      });

      setTrackingDialogOpen(false);

      // Si le statut n'est pas déjà "shipped", proposer de le mettre à jour
      if (order.status !== "shipped") {
        setNewStatus("shipped");
        setStatusNote(
          "Commande expédiée avec numéro de suivi " +
            trackingInfo.trackingNumber
        );
        setStatusDialogOpen(true);
      }
    } catch (error) {
      console.error("Error updating tracking info:", error);
      toast.error(
        "Une erreur est survenue lors de la mise à jour des informations de suivi"
      );
    }
  };

  // Envoyer un e-mail au client
  const sendEmail = async () => {
    if (!order) return;

    // Vérifier que les champs obligatoires sont remplis
    if (!emailSubject || !emailBody) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      // Dans une application réelle, vous auriez un endpoint API pour envoyer l'e-mail
      // Ici, nous allons simuler l'envoi
      toast.success("E-mail envoyé", {
        description: "L'e-mail a été envoyé au client avec succès.",
        duration: 3000,
      });

      setEmailDialogOpen(false);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Une erreur est survenue lors de l'envoi de l'e-mail");
    }
  };

  // Enregistrer une note administrative
  const saveAdminNote = async () => {
    if (!order) return;

    try {
      // Dans une application réelle, vous auriez un endpoint API pour enregistrer la note
      // Ici, nous allons simuler l'enregistrement
      toast.success("Note enregistrée", {
        description: "La note a été enregistrée avec succès.",
        duration: 3000,
      });

      setNoteDialogOpen(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(
        "Une erreur est survenue lors de l'enregistrement de la note"
      );
    }
  };

  // Actions simulées (impression, téléchargement)
  const printOrder = () => {
    toast.success("Impression de la commande", {
      description: "La commande est en cours d'impression",
      duration: 3000,
    });
  };

  const downloadInvoice = () => {
    toast.success("Téléchargement de la facture", {
      description: "La facture est en cours de téléchargement",
      duration: 3000,
    });
  };

  const downloadPackingSlip = () => {
    toast.success("Téléchargement du bordereau", {
      description: "Le bordereau d'expédition est en cours de téléchargement",
      duration: 3000,
    });
  };

  // Affichage des chargements
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <Skeleton className="h-9 w-24 mr-4" />
          <Skeleton className="h-6 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
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

          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Si la commande n'existe pas
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6 inline-block">
          <Package size={32} />
        </div>
        <h1 className="text-2xl font-medium mb-4">Commande introuvable</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Nous n'avons pas trouvé la commande que vous recherchez. Elle a
          peut-être été supprimée ou l'identifiant est incorrect.
        </p>
        <Button asChild>
          <Link to="/admin/orders">Retour à la liste des commandes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2 gap-1" asChild>
            <Link to="/admin/orders">
              <ChevronLeft size={16} />
              Retour
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Commande #{orderId?.substring(0, 8).toUpperCase()}
          </h1>
          <Badge
            variant="outline"
            className={`ml-3
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
              ${
                order.status === "refunded"
                  ? "bg-gray-100 text-gray-800 border-gray-200"
                  : ""
              }
            `}
          >
            {getStatusConfig(order.status).label}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={printOrder}
          >
            <Printer size={14} />
            Imprimer
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={downloadInvoice}
          >
            <Download size={14} />
            Facture
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setEmailDialogOpen(true)}
          >
            <Mail size={14} />
            Contacter
          </Button>

          <Button
            size="sm"
            className="gap-1"
            onClick={() => setStatusDialogOpen(true)}
          >
            <Edit size={14} />
            Modifier le statut
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="md:col-span-2 space-y-6">
          {/* Informations de la commande */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Détails de la commande
              </CardTitle>
              <CardDescription>
                Commande passée le {formatDate(order.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Statut actuel avec explication */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start">
                  {order.status === "pending" && (
                    <Clock size={18} className="text-yellow-600 mr-2 mt-0.5" />
                  )}
                  {order.status === "processing" && (
                    <Package size={18} className="text-blue-600 mr-2 mt-0.5" />
                  )}
                  {order.status === "shipped" && (
                    <TruckIcon
                      size={18}
                      className="text-purple-600 mr-2 mt-0.5"
                    />
                  )}
                  {order.status === "delivered" && (
                    <CheckCircle
                      size={18}
                      className="text-green-600 mr-2 mt-0.5"
                    />
                  )}
                  {order.status === "cancelled" && (
                    <XCircle size={18} className="text-red-600 mr-2 mt-0.5" />
                  )}
                  {order.status === "refunded" && (
                    <RefreshCw
                      size={18}
                      className="text-gray-600 mr-2 mt-0.5"
                    />
                  )}

                  <div>
                    <h3 className="font-medium">
                      {getStatusConfig(order.status).label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getStatusConfig(order.status).description}
                    </p>

                    {order.status === "shipped" && order.trackingInfo && (
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-muted-foreground mr-2">
                          Suivi:
                        </span>
                        <a
                          href={order.trackingInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          {order.trackingInfo.carrier} -{" "}
                          {order.trackingInfo.trackingNumber}
                          <ExternalLink size={12} className="ml-1" />
                        </a>
                      </div>
                    )}

                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => setStatusDialogOpen(true)}
                      >
                        <Edit size={12} />
                        Modifier
                      </Button>

                      {order.status === "processing" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setTrackingDialogOpen(true)}
                        >
                          <TruckIcon size={12} />
                          Ajouter suivi
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Articles commandés */}
              <div>
                <h3 className="text-sm font-medium mb-3">Articles commandés</h3>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead className="text-center">Quantité</TableHead>
                        <TableHead className="text-right">
                          Prix unitaire
                        </TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  SKU: {item.productId.substring(0, 8)}
                                </div>

                                {/* Options du produit (si présentes) */}
                                {item.options &&
                                  Object.keys(item.options).length > 0 && (
                                    <div className="mt-1">
                                      {Object.entries(item.options).map(
                                        ([key, value]) => (
                                          <div
                                            key={key}
                                            className="flex items-center text-xs text-muted-foreground"
                                          >
                                            <ArrowRight
                                              size={10}
                                              className="mr-1"
                                            />
                                            <span className="capitalize">
                                              {key}:
                                            </span>
                                            <span className="ml-1 font-medium">
                                              {value}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.price.toLocaleString()} XAF
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(item.price * item.quantity).toLocaleString()} XAF
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Récapitulatif des coûts */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">Récapitulatif</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{order.subtotal.toLocaleString()} XAF</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Frais de livraison
                    </span>
                    <span>
                      {order.shipping === 0 ? (
                        <span className="text-green-600">Gratuit</span>
                      ) : (
                        `${order.shipping.toLocaleString()} XAF`
                      )}
                    </span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        Réduction
                        {order.promoCodeApplied && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info
                                  size={12}
                                  className="ml-1 text-muted-foreground"
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Code promo : {order.promoCodeApplied}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </span>
                      <span className="text-green-600">
                        -{order.discount.toLocaleString()} XAF
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-medium text-base pt-2">
                    <span>Total</span>
                    <span>{order.total.toLocaleString()} XAF</span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Statut du paiement</span>
                    <span
                      className={`
                      ${
                        order.paymentInfo.status === "paid"
                          ? "text-green-600"
                          : order.paymentInfo.status === "pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }
                    `}
                    >
                      {order.paymentInfo.status === "paid"
                        ? "Payé"
                        : order.paymentInfo.status === "pending"
                        ? "En attente"
                        : "Échoué"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes internes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Notes internes</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => setNoteDialogOpen(true)}
                  >
                    <Plus size={12} />
                    Ajouter une note
                  </Button>
                </div>

                <div className="border rounded-lg p-4 min-h-[100px] text-sm">
                  {order.notes ? (
                    <p className="whitespace-pre-line">{order.notes}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Aucune note pour cette commande.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onglets (Historique et Actions) */}
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="actions">Actions rapides</TabsTrigger>
            </TabsList>

            {/* Onglet Historique */}
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Historique de la commande
                  </CardTitle>
                  <CardDescription>
                    Suivi des modifications et des statuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {statusHistory.length > 0 ? (
                    <div className="relative pl-6">
                      {/* Ligne verticale */}
                      <div className="absolute left-2 top-0 bottom-0 w-px bg-border"></div>

                      <div className="space-y-6">
                        {statusHistory.map((status, index) => (
                          <div key={index} className="relative">
                            {/* Cercle pour chaque étape */}
                            <div className="absolute left-[-6px] top-0 w-3 h-3 rounded-full border-2 border-primary bg-background"></div>

                            <div className="space-y-1 pb-2">
                              <div className="flex items-center">
                                <Badge className="mr-2" variant="outline">
                                  {getStatusConfig(status.status).label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(status.timestamp)}
                                </span>
                              </div>

                              {status.note && (
                                <p className="text-sm pl-1">{status.note}</p>
                              )}

                              {status.updatedBy && (
                                <p className="text-xs text-muted-foreground pl-1">
                                  Par: {status.updatedBy}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <History
                        size={24}
                        className="mx-auto text-muted-foreground mb-2"
                      />
                      <p className="text-muted-foreground">
                        Aucun historique disponible
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Actions rapides */}
            <TabsContent value="actions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions rapides</CardTitle>
                  <CardDescription>
                    Opérations courantes pour cette commande
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="justify-start gap-2 h-auto py-3"
                      onClick={downloadInvoice}
                    >
                      <FileText size={16} className="text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Générer la facture</div>
                        <div className="text-xs text-muted-foreground">
                          Format PDF
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start gap-2 h-auto py-3"
                      onClick={downloadPackingSlip}
                    >
                      <ClipboardCheck size={16} className="text-primary" />
                      <div className="text-left">
                        <div className="font-medium">
                          Bordereau d'expédition
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Pour l'expédition
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start gap-2 h-auto py-3"
                      onClick={() => setEmailDialogOpen(true)}
                    >
                      <Mail size={16} className="text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Envoyer un e-mail</div>
                        <div className="text-xs text-muted-foreground">
                          Contacter le client
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start gap-2 h-auto py-3"
                      onClick={() => setStatusDialogOpen(true)}
                    >
                      <ArrowUpDown size={16} className="text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Changer le statut</div>
                        <div className="text-xs text-muted-foreground">
                          Mettre à jour la commande
                        </div>
                      </div>
                    </Button>

                    {order.status === "processing" && (
                      <Button
                        variant="outline"
                        className="justify-start gap-2 h-auto py-3"
                        onClick={() => setTrackingDialogOpen(true)}
                      >
                        <TruckIcon size={16} className="text-primary" />
                        <div className="text-left">
                          <div className="font-medium">Ajouter le suivi</div>
                          <div className="text-xs text-muted-foreground">
                            Informations d'expédition
                          </div>
                        </div>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="justify-start gap-2 h-auto py-3"
                      asChild
                    >
                      <Link to={`/admin/customers/${order.userId}`}>
                        <User size={16} className="text-primary" />
                        <div className="text-left">
                          <div className="font-medium">Profil client</div>
                          <div className="text-xs text-muted-foreground">
                            Voir les détails du client
                          </div>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations du client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User size={16} className="mr-2" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.email || "Email non spécifié"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shippingAddress.phone}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setEmailDialogOpen(true)}
                >
                  <Mail size={14} />
                  Email
                </Button>

                <Button variant="outline" size="sm" className="gap-1" asChild>
                  <Link to={`/admin/customers/${order.userId}`}>
                    <User size={14} />
                    Profil
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Adresses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin size={16} className="mr-2" />
                Adresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm text-muted-foreground mb-1">
                  Adresse de livraison
                </h3>
                <div className="text-sm">
                  <p className="font-medium">
                    {order.shippingAddress.firstName}{" "}
                    {order.shippingAddress.lastName}
                  </p>
                  <p>
                    {order.shippingAddress.address}
                    {order.shippingAddress.address2 && (
                      <>, {order.shippingAddress.address2}</>
                    )}
                  </p>
                  <p>
                    {order.shippingAddress.postalCode}{" "}
                    {order.shippingAddress.city}
                  </p>
                  <p>
                    {order.shippingAddress.state},{" "}
                    {order.shippingAddress.country}
                  </p>
                  <p>{order.shippingAddress.phone}</p>
                </div>
              </div>

              {order.billingAddress &&
                order.billingAddress !== order.shippingAddress && (
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">
                      Adresse de facturation
                    </h3>
                    <div className="text-sm">
                      <p className="font-medium">
                        {order.billingAddress.firstName}{" "}
                        {order.billingAddress.lastName}
                      </p>
                      <p>
                        {order.billingAddress.address}
                        {order.billingAddress.address2 && (
                          <>, {order.billingAddress.address2}</>
                        )}
                      </p>
                      <p>
                        {order.billingAddress.postalCode}{" "}
                        {order.billingAddress.city}
                      </p>
                      <p>
                        {order.billingAddress.state},{" "}
                        {order.billingAddress.country}
                      </p>
                      <p>{order.billingAddress.phone}</p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Paiement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CreditCard size={16} className="mr-2" />
                Paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Méthode</p>
                  <p className="font-medium">
                    {order.paymentInfo.method === "card" && "Carte bancaire"}
                    {order.paymentInfo.method === "paypal" && "PayPal"}
                    {order.paymentInfo.method === "transfer" &&
                      "Virement bancaire"}
                    {order.paymentInfo.method === "cash" &&
                      "Paiement à la livraison"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge
                    variant="outline"
                    className={`
                      ${
                        order.paymentInfo.status === "paid"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : order.paymentInfo.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }
                    `}
                  >
                    {order.paymentInfo.status === "paid"
                      ? "Payé"
                      : order.paymentInfo.status === "pending"
                      ? "En attente"
                      : "Échoué"}
                  </Badge>
                </div>
              </div>

              {order.paymentInfo.cardInfo && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Détails du paiement
                  </p>
                  <p className="text-sm">
                    {order.paymentInfo.cardInfo.brand} ****{" "}
                    {order.paymentInfo.cardInfo.lastFour}
                  </p>
                </div>
              )}

              {order.paymentInfo.transactionId && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Transaction ID
                  </p>
                  <p className="text-sm font-mono">
                    {order.paymentInfo.transactionId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Autres commandes du client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ListChecks size={16} className="mr-2" />
                Historique du client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm">
                  Total des commandes: <span className="font-medium">3</span>
                </p>
                <p className="text-sm">
                  Montant total dépensé:{" "}
                  <span className="font-medium">247 500 XAF</span>
                </p>
                <p className="text-sm">
                  Client depuis: <span className="font-medium">3 mois</span>
                </p>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1"
                  asChild
                >
                  <Link to={`/admin/customers/${order.userId}`}>
                    <User size={14} />
                    Voir le profil complet
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogue de changement de statut */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le statut de la commande</DialogTitle>
            <DialogDescription>
              Commande #{order.id.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Nouveau statut</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as OrderStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                        En attente
                      </div>
                    </SelectItem>
                    <SelectItem value="processing">
                      <div className="flex items-center">
                        <Package className="mr-2 h-4 w-4 text-blue-600" />
                        En traitement
                      </div>
                    </SelectItem>
                    <SelectItem value="shipped">
                      <div className="flex items-center">
                        <TruckIcon className="mr-2 h-4 w-4 text-purple-600" />
                        Expédiée
                      </div>
                    </SelectItem>
                    <SelectItem value="delivered">
                      <div className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Livrée
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center">
                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                        Annulée
                      </div>
                    </SelectItem>
                    <SelectItem value="refunded">
                      <div className="flex items-center">
                        <RefreshCw className="mr-2 h-4 w-4 text-gray-600" />
                        Remboursée
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (optionnelle)</Label>
                <Textarea
                  id="note"
                  placeholder="Ajoutez une note concernant ce changement de statut..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>

              {newStatus === "shipped" && (
                <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        Ajouter des informations de suivi
                      </p>
                      <p className="mt-1">
                        N'oubliez pas d'ajouter les informations de suivi
                        d'expédition pour cette commande.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {newStatus === "cancelled" && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Annulation de commande</p>
                      <p className="mt-1">
                        L'annulation d'une commande est définitive. Le client
                        sera notifié par email.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={updateOrderStatus} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour le suivi d'expédition */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter des informations de suivi</DialogTitle>
            <DialogDescription>
              Commande #{order.id.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="carrier">Transporteur *</Label>
                <Input
                  id="carrier"
                  placeholder="DHL, Chronopost, etc."
                  value={trackingInfo.carrier}
                  onChange={(e) =>
                    setTrackingInfo((prev) => ({
                      ...prev,
                      carrier: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Numéro de suivi *</Label>
                <Input
                  id="trackingNumber"
                  placeholder="123456789"
                  value={trackingInfo.trackingNumber}
                  onChange={(e) =>
                    setTrackingInfo((prev) => ({
                      ...prev,
                      trackingNumber: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackingUrl">URL de suivi</Label>
                <Input
                  id="trackingUrl"
                  placeholder="https://www.transporteur.com/suivi?numero=123456789"
                  value={trackingInfo.url}
                  onChange={(e) =>
                    setTrackingInfo((prev) => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Si non spécifié, une URL générique sera générée.
                </p>
              </div>

              <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                <div className="flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5" />
                  <p>
                    En ajoutant ces informations, un email de notification sera
                    automatiquement envoyé au client avec les détails de suivi.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTrackingDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={updateTrackingInfo}>
              Enregistrer et notifier le client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour envoyer un e-mail */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Envoyer un e-mail au client</DialogTitle>
            <DialogDescription>
              Le message sera envoyé à{" "}
              {order.shippingAddress.email || "l'adresse email du client"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  placeholder="Sujet de l'e-mail"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Contenu *</Label>
                <Textarea
                  id="body"
                  placeholder="Contenu de l'e-mail..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="templates">
                  <AccordionTrigger>
                    <span className="text-sm">Modèles d'e-mail</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setEmailSubject(
                            `Confirmation d'expédition de votre commande #${order.id
                              .substring(0, 8)
                              .toUpperCase()}`
                          );
                          setEmailBody(`Cher/Chère ${
                            order.shippingAddress.firstName
                          },

Nous sommes heureux de vous informer que votre commande #${order.id
                            .substring(0, 8)
                            .toUpperCase()} a été expédiée.

Détails du suivi :
- Transporteur : ${trackingInfo.carrier || "[Nom du transporteur]"}
- Numéro de suivi : ${trackingInfo.trackingNumber || "[Numéro de suivi]"}
- URL de suivi : ${trackingInfo.url || "[URL de suivi]"}

Nous vous remercions pour votre commande et espérons qu'elle vous apportera entière satisfaction.

Cordialement,
L'équipe de Floralie`);
                        }}
                      >
                        Confirmation d'expédition
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setEmailSubject(
                            `Important : Mise à jour concernant votre commande #${order.id
                              .substring(0, 8)
                              .toUpperCase()}`
                          );
                          setEmailBody(`Cher/Chère ${
                            order.shippingAddress.firstName
                          },

Nous souhaitons vous informer d'une mise à jour concernant votre commande #${order.id
                            .substring(0, 8)
                            .toUpperCase()} passée le ${formatDate(
                            order.createdAt
                          )}.

[Description de la mise à jour ou du problème]

Nous nous excusons pour tout inconvénient que cela pourrait causer et restons à votre disposition pour toute question.

Cordialement,
L'équipe de Floralie`);
                        }}
                      >
                        Notification de problème
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setEmailSubject(
                            `Votre commande #${order.id
                              .substring(0, 8)
                              .toUpperCase()} a été livrée`
                          );
                          setEmailBody(`Cher/Chère ${
                            order.shippingAddress.firstName
                          },

Nous sommes heureux de vous informer que votre commande #${order.id
                            .substring(0, 8)
                            .toUpperCase()} a été livrée.

Nous espérons que vous êtes satisfait(e) de votre achat. Votre avis est important pour nous, n'hésitez pas à nous faire part de vos commentaires.

Merci de votre confiance,
L'équipe de Floralie`);
                        }}
                      >
                        Confirmation de livraison
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={sendEmail}>
              <Send size={14} className="mr-2" />
              Envoyer l'e-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour ajouter une note */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une note interne</DialogTitle>
            <DialogDescription>
              Cette note sera visible uniquement par l'équipe administrative.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  placeholder="Ajoutez des informations importantes concernant cette commande..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveAdminNote}>Enregistrer la note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrderDetail;
