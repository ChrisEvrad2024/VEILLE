// src/pages/admin/AdminQuoteDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Heart,
  Building,
  Cake,
  Home,
  Flower,
  Trophy,
  Sparkles,
  Info,
  Search,
  Download,
  Printer,
  User,
  MapPin,
  Plus,
  Pencil,
  Check,
  Phone,
  MessageSquare,
  Save,
  Send,
  RefreshCw,
  Edit,
  Trash2,
  ArrowRight,
} from "lucide-react";
import {
  quoteService,
  QuoteRequest,
  QuoteStatus,
  Quote,
  QuoteItem,
} from "@/services/quote.service";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interface pour un élément du formulaire de proposition
interface QuoteFormItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const AdminQuoteDetail = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();

  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // États pour les actions de proposition
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteItems, setQuoteItems] = useState<QuoteFormItem[]>([]);
  const [quoteNote, setQuoteNote] = useState("");
  const [validityDays, setValidityDays] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  // États pour la mise à jour de statut
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<QuoteStatus>("in_review");
  const [statusNote, setStatusNote] = useState("");

  // État pour la communication
  const [clientMessage, setClientMessage] = useState("");

  // Chargement du devis
  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId) {
        toast.error("ID de devis manquant");
        navigate("/admin/quotes");
        return;
      }

      setIsLoading(true);

      try {
        // Vérifier si l'utilisateur est un administrateur
        if (!authService.isAuthenticated() || !authService.isAdmin()) {
          navigate("/auth/login?redirect=/admin/quotes/" + quoteId);
          return;
        }

        // Charger la demande de devis
        const quoteReqData = await quoteService.getQuoteRequestById(quoteId);

        if (!quoteReqData) {
          toast.error("Devis introuvable");
          navigate("/admin/quotes");
          return;
        }

        setQuoteRequest(quoteReqData);

        // Charger le devis associé (s'il existe)
        try {
          const quoteData = await quoteService.getQuoteById(quoteId);
          if (quoteData) {
            setQuote(quoteData);

            // Si nous avons un devis, initialiser le formulaire avec ses données
            setQuoteItems(
              quoteData.items.map((item) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              }))
            );

            setQuoteNote(quoteData.notes || "");

            // Calculer les jours de validité restants
            const validUntil = new Date(quoteData.validUntil);
            const createdAt = new Date(quoteData.createdAt);
            const daysDiff = Math.round(
              (validUntil.getTime() - createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            setValidityDays(daysDiff);
          } else {
            // Si pas de devis existant, initialiser avec un élément vide
            addNewItem();
          }
        } catch (error) {
          console.info("No quote found for this request yet");
          // Si pas de devis existant, initialiser avec un élément vide
          addNewItem();
        }
      } catch (error) {
        console.error("Error loading quote:", error);
        toast.error("Erreur lors du chargement du devis");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuote();
  }, [quoteId, navigate]);

  // Ajouter un nouvel élément au formulaire de devis
  const addNewItem = () => {
    setQuoteItems((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  // Mettre à jour un élément du formulaire de devis
  const updateQuoteItem = (
    index: number,
    field: keyof QuoteFormItem,
    value: string | number
  ) => {
    setQuoteItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return newItems;
    });
  };

  // Supprimer un élément du formulaire de devis
  const removeQuoteItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculer le total pour un élément
  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  // Calculer le total du devis
  const calculateQuoteTotal = () => {
    const subtotal = quoteItems.reduce(
      (sum, item) => sum + calculateItemTotal(item.quantity, item.unitPrice),
      0
    );
    const tax = subtotal * 0.2; // TVA à 20%
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  // Soumettre le formulaire de devis
  const submitQuoteForm = async () => {
    if (quoteItems.length === 0) {
      toast.error("Veuillez ajouter au moins un élément au devis");
      return;
    }

    // Vérifier que tous les éléments ont des données valides
    const invalidItems = quoteItems.filter(
      (item) =>
        !item.name.trim() ||
        !item.description.trim() ||
        item.quantity <= 0 ||
        item.unitPrice <= 0
    );

    if (invalidItems.length > 0) {
      toast.error("Certains éléments du devis sont incomplets ou invalides");
      return;
    }

    setIsSaving(true);

    try {
      if (!quoteId) return;

      // Si un devis existe déjà, le mettre à jour, sinon en créer un nouveau
      if (quote) {
        // Mettre à jour le devis existant
        const result = await quoteService.updateQuote(quoteId, {
          items: quoteItems.map((item) => ({
            id: item.id,
            quoteId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: calculateItemTotal(item.quantity, item.unitPrice),
          })),
          notes: quoteNote,
          validUntil: (() => {
            const date = new Date();
            date.setDate(date.getDate() + validityDays);
            return date.toISOString();
          })(),
        });

        if (result.success) {
          toast.success("Devis mis à jour avec succès");
          // Recharger le devis
          const updatedQuote = await quoteService.getQuoteById(quoteId);
          if (updatedQuote) {
            setQuote(updatedQuote);
          }
          setShowQuoteForm(false);
        } else {
          toast.error(result.message);
        }
      } else {
        // Créer un nouveau devis
        const result = await quoteService.createQuote(
          quoteId,
          quoteItems.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          quoteNote,
          "Devis créé par l'administrateur",
          validityDays
        );

        if (result.success) {
          toast.success("Devis créé avec succès");
          // Recharger le devis
          const newQuote = await quoteService.getQuoteById(quoteId);
          if (newQuote) {
            setQuote(newQuote);
          }
          // Mettre à jour le statut de la demande
          await quoteService.updateQuoteRequestStatus(
            quoteId,
            "awaiting_customer",
            "Devis créé et envoyé au client"
          );
          // Recharger la demande
          const updatedRequest = await quoteService.getQuoteRequestById(
            quoteId
          );
          if (updatedRequest) {
            setQuoteRequest(updatedRequest);
          }
          setShowQuoteForm(false);
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error("Error saving quote:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement du devis");
    } finally {
      setIsSaving(false);
    }
  };

  // Mettre à jour le statut de la demande
  const updateRequestStatus = async () => {
    if (!quoteId || !quoteRequest) return;

    try {
      const result = await quoteService.updateQuoteRequestStatus(
        quoteId,
        newStatus,
        statusNote
      );

      if (result.success) {
        toast.success("Statut mis à jour avec succès");

        // Recharger la demande
        const updatedRequest = await quoteService.getQuoteRequestById(quoteId);
        if (updatedRequest) {
          setQuoteRequest(updatedRequest);
        }

        setStatusDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Une erreur est survenue lors de la mise à jour du statut");
    }
  };

  // Envoyer un message au client
  const sendClientMessage = async () => {
    if (!clientMessage.trim() || !quoteRequest) {
      toast.error("Veuillez saisir un message");
      return;
    }

    // Simuler l'envoi d'un email au client
    toast.success("Message envoyé au client", {
      description: `Un email a été envoyé à ${quoteRequest.userEmail}`,
      duration: 3000,
    });

    setClientMessage("");
  };

  // Formatter la date
  const formatDate = (dateString: string | undefined) => {
    try {
      // Vérifier si dateString est undefined ou vide
      if (!dateString) {
        return "Date non définie";
      }

      const date = new Date(dateString);

      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }

      return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Date invalide";
    }
  };

  // Obtenir l'icône pour un type d'événement
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "wedding":
        return <Heart size={20} />;
      case "birthday":
        return <Cake size={20} />;
      case "corporate":
        return <Building size={20} />;
      case "funeral":
        return <Flower size={20} />;
      case "graduation":
        return <Trophy size={20} />;
      case "housewarming":
        return <Home size={20} />;
      default:
        return <Sparkles size={20} />;
    }
  };

  // Traduire le type d'événement
  const translateEventType = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "wedding":
        return "Mariage";
      case "birthday":
        return "Anniversaire";
      case "corporate":
        return "Événement d'entreprise";
      case "funeral":
        return "Funérailles";
      case "graduation":
        return "Remise de diplôme";
      case "housewarming":
        return "Pendaison de crémaillère";
      default:
        return "Autre";
    }
  };

  // Obtenir la configuration pour un statut
  const getStatusConfig = (status: QuoteStatus) => {
    return quoteService.getQuoteStatusConfig(status);
  };

  // Simuler l'impression ou l'export du devis
  const printQuote = () => {
    toast.success("Impression du devis en cours");
  };

  const downloadQuote = () => {
    toast.success("Téléchargement du devis en cours");
  };

  // Affichage des chargements
  if (isLoading) {
    return (
      <div className="space-y-8">
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

              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Si la demande de devis n'existe pas
  if (!quoteRequest) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Devis introuvable
            </h1>
            <p className="text-muted-foreground">
              Le devis que vous recherchez n'existe pas ou a été supprimé.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/quotes")}>
            <ChevronLeft size={16} className="mr-2" />
            Retour à la liste
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Devis introuvable</h3>
            <p className="text-muted-foreground mt-1 text-center">
              Nous n'avons pas trouvé le devis que vous recherchez. Il a
              peut-être été supprimé ou l'identifiant est incorrect.
            </p>
            <Button asChild className="mt-4">
              <Link to="/admin/quotes">Voir tous les devis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Devis #{quoteId?.substring(0, 8).toUpperCase()}
            <Badge
              variant="outline"
              className={`
                ${
                  quoteRequest.status === "pending"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : ""
                }
                ${
                  quoteRequest.status === "in_review"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : ""
                }
                ${
                  quoteRequest.status === "awaiting_customer"
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : ""
                }
                ${
                  quoteRequest.status === "accepted"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : ""
                }
                ${
                  quoteRequest.status === "rejected"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : ""
                }
                ${
                  quoteRequest.status === "expired"
                    ? "bg-gray-100 text-gray-800 border-gray-200"
                    : ""
                }
              `}
            >
              {getStatusConfig(quoteRequest.status).label}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Demande créée le {formatDate(quoteRequest.createdAt)} par{" "}
            {quoteRequest.userName}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/quotes")}>
            <ChevronLeft size={16} className="mr-2" />
            Retour à la liste
          </Button>

          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Pencil size={16} className="mr-2" />
                Changer le statut
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le statut</DialogTitle>
                <DialogDescription>
                  Changez le statut de la demande de devis #
                  {quoteId?.substring(0, 8).toUpperCase()}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Nouveau statut</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value) =>
                      setNewStatus(value as QuoteStatus)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                          En attente
                        </div>
                      </SelectItem>
                      <SelectItem value="in_review">
                        <div className="flex items-center">
                          <Search className="mr-2 h-4 w-4 text-blue-600" />
                          En cours d'analyse
                        </div>
                      </SelectItem>
                      <SelectItem value="awaiting_customer">
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-purple-600" />
                          En attente de réponse
                        </div>
                      </SelectItem>
                      <SelectItem value="accepted">
                        <div className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          Accepté
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center">
                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                          Refusé
                        </div>
                      </SelectItem>
                      <SelectItem value="expired">
                        <div className="flex items-center">
                          <AlertTriangle className="mr-2 h-4 w-4 text-gray-600" />
                          Expiré
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Note (visible en interne uniquement)</Label>
                  <Textarea
                    placeholder="Ajoutez une note sur ce changement de statut..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setStatusDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={updateRequestStatus}>Mettre à jour</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {quote && (
            <>
              <Button variant="outline" onClick={printQuote}>
                <Printer size={16} className="mr-2" />
                Imprimer
              </Button>

              <Button variant="outline" onClick={downloadQuote}>
                <Download size={16} className="mr-2" />
                Télécharger
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Onglets d'information */}
      <Tabs defaultValue="request">
        <TabsList className="mb-6">
          <TabsTrigger value="request">Détail de la demande</TabsTrigger>
          <TabsTrigger value="quote">
            {quote ? "Proposition commerciale" : "Créer une proposition"}
          </TabsTrigger>
          <TabsTrigger value="communication">Communication client</TabsTrigger>
        </TabsList>

        {/* Onglet détail de la demande */}
        <TabsContent value="request">
          <div className="grid grid-cols-1 gap-8">
            {/* Détails de la demande */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    {getEventTypeIcon(quoteRequest.eventType)}
                  </div>
                  {translateEventType(quoteRequest.eventType)}
                </CardTitle>
                <CardDescription>
                  Événement prévu le {formatDate(quoteRequest.eventDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informations principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Date de l'événement
                    </Label>
                    <p className="font-medium">
                      {formatDate(quoteRequest.eventDate)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Budget
                    </Label>
                    <p className="font-medium">
                      {quoteRequest.budget?.toLocaleString() || "0"} XAF
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Statut actuel
                    </Label>
                    <p className="font-medium">
                      {getStatusConfig(quoteRequest.status).label}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Description détaillée */}
                <div>
                  <Label className="text-muted-foreground text-sm">
                    Description de la demande
                  </Label>
                  <div className="mt-2 p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-line">
                    {quoteRequest.description}
                  </div>
                </div>

                {/* Images jointes (s'il y en a) */}
                {quoteRequest.attachments &&
                  quoteRequest.attachments.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground text-sm">
                        Images d'inspiration
                      </Label>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {quoteRequest.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-md overflow-hidden bg-muted border"
                          >
                            {attachment ? (
                              <img
                                src={attachment}
                                alt={`Image d'inspiration ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback si l'image ne charge pas
                                  e.currentTarget.src =
                                    "/src/assets/logo.jpeg";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <span className="text-muted-foreground text-sm">
                                  Image non disponible
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Informations du client */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du client</CardTitle>
                <CardDescription>
                  Coordonnées du client à contacter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">Nom</Label>
                    <p className="font-medium">{quoteRequest.userName}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">
                      Email
                    </Label>
                    <p className="font-medium">
                      <a
                        href={`mailto:${quoteRequest.userEmail}`}
                        className="text-primary hover:underline"
                      >
                        {quoteRequest.userEmail}
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">
                      Téléphone
                    </Label>
                    <p className="font-medium">
                      <a
                        href={`tel:${quoteRequest.userPhone}`}
                        className="text-primary hover:underline"
                      >
                        {quoteRequest.userPhone}
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30">
                <div className="flex items-center space-x-2 w-full">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      // Simuler une conversation dans la messagerie interne
                      toast.success("Action de messagerie", {
                        description:
                          "En situation réelle, cela ouvrirait la messagerie interne",
                      });
                    }}
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Contacter le client
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet proposition commerciale */}
        <TabsContent value="quote">
          {showQuoteForm ? (
            /* Formulaire d'édition de devis */
            <Card>
              <CardHeader>
                <CardTitle>
                  {quote
                    ? "Modifier la proposition"
                    : "Nouvelle proposition commerciale"}
                </CardTitle>
                <CardDescription>
                  {quote
                    ? "Modifiez les détails de votre proposition commerciale"
                    : "Créez une proposition commerciale en réponse à la demande de devis"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Éléments du devis */}
                <div>
                  <Label className="text-base font-medium">
                    Éléments du devis
                  </Label>
                  <div className="space-y-4 mt-4">
                    {quoteItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg"
                      >
                        <div className="col-span-12 sm:col-span-5 space-y-2">
                          <Label className="text-sm">Désignation</Label>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              updateQuoteItem(index, "name", e.target.value)
                            }
                            placeholder="Ex: Bouquet de mariée"
                          />
                        </div>

                        <div className="col-span-12 sm:col-span-3 space-y-2">
                          <Label className="text-sm">Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateQuoteItem(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Ex: Roses blanches et pivoines"
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-1 space-y-2">
                          <Label className="text-sm">Qté</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuoteItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-2 space-y-2">
                          <Label className="text-sm">Prix unitaire</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateQuoteItem(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>

                        <div className="hidden sm:flex sm:col-span-1 items-end justify-end h-full">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuoteItem(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={addNewItem}
                      className="w-full"
                    >
                      <Plus size={16} className="mr-2" />
                      Ajouter un élément
                    </Button>
                  </div>
                </div>

                {/* Récapitulatif des totaux */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-3">Récapitulatif</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>
                        {calculateQuoteTotal().subtotal?.toLocaleString() ||
                          "0"}{" "}
                        XAF
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA (20%)</span>
                      <span>
                        {calculateQuoteTotal().tax?.toLocaleString() || "0"} XAF
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-medium text-base pt-2">
                      <span>Total TTC</span>
                      <span>
                        {calculateQuoteTotal().total?.toLocaleString() || "0"}{" "}
                        XAF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message au client et validité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Message au client</Label>
                    <Textarea
                      placeholder="Ajoutez un message personnalisé pour votre client..."
                      value={quoteNote}
                      onChange={(e) => setQuoteNote(e.target.value)}
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ce message sera inclus dans le devis envoyé au client.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Durée de validité</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="90"
                          value={validityDays}
                          onChange={(e) =>
                            setValidityDays(parseInt(e.target.value) || 30)
                          }
                          className="w-24"
                        />
                        <span>jours</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Le devis sera valable pendant cette durée à compter de
                        sa date d'envoi.
                      </p>
                    </div>

                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
                      <div className="flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">Information</p>
                          <p className="mt-1">
                            Une fois le devis envoyé, le client recevra une
                            notification par email l'invitant à consulter sa
                            proposition.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowQuoteForm(false)}
                >
                  Annuler
                </Button>
                <Button onClick={submitQuoteForm} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {quote
                        ? "Mettre à jour le devis"
                        : "Créer et envoyer le devis"}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : quote ? (
            /* Affichage du devis existant */
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>Proposition Commerciale</CardTitle>
                    <CardDescription>
                      Créée le {formatDate(quote.createdAt)} • Valide jusqu'au{" "}
                      {formatDate(quote.validUntil)}
                    </CardDescription>
                  </div>

                  <Button onClick={() => setShowQuoteForm(true)}>
                    <Edit size={16} className="mr-2" />
                    Modifier
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Message d'introduction */}
                {quote.notes && (
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Message au client:</span>
                    </p>
                    <p className="text-sm mt-1 italic">"{quote.notes}"</p>
                  </div>
                )}

                {/* Détail des articles */}
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Détail de la proposition
                  </h3>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm">
                            Description
                          </th>
                          <th className="px-4 py-3 text-center text-sm">
                            Quantité
                          </th>
                          <th className="px-4 py-3 text-right text-sm">
                            Prix unitaire
                          </th>
                          <th className="px-4 py-3 text-right text-sm">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {quote &&
                          quote.items &&
                          quote.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.description}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-4 text-right">
                                {item.unitPrice?.toLocaleString() || "0"} XAF
                              </td>
                              <td className="px-4 py-4 text-right font-medium">
                                {item.total?.toLocaleString() || "0"} XAF
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Récapitulatif des prix */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{quote.subtotal?.toLocaleString() || "0"} XAF</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TVA (20%)</span>
                      <span>{quote.tax?.toLocaleString() || "0"} XAF</span>
                    </div>

                    {quote.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remise</span>
                        <span className="text-green-600">
                          -{quote.discount?.toLocaleString() || "0"} XAF
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between font-medium text-lg pt-2">
                      <span>Total TTC</span>
                      <span>{quote.total?.toLocaleString() || "0"} XAF</span>
                    </div>
                  </div>
                </div>

                {/* Statut du devis */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                      <div
                        className={`
                        p-2 rounded-full mr-3
                        ${
                          quoteRequest.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : ""
                        }
                        ${
                          quoteRequest.status === "in_review"
                            ? "bg-blue-100 text-blue-800"
                            : ""
                        }
                        ${
                          quoteRequest.status === "awaiting_customer"
                            ? "bg-purple-100 text-purple-800"
                            : ""
                        }
                        ${
                          quoteRequest.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                        ${
                          quoteRequest.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : ""
                        }
                        ${
                          quoteRequest.status === "expired"
                            ? "bg-gray-100 text-gray-800"
                            : ""
                        }
                      `}
                      >
                        {quoteRequest.status === "pending" && (
                          <Clock size={16} />
                        )}
                        {quoteRequest.status === "in_review" && (
                          <Search size={16} />
                        )}
                        {quoteRequest.status === "awaiting_customer" && (
                          <Mail size={16} />
                        )}
                        {quoteRequest.status === "accepted" && (
                          <CheckCircle size={16} />
                        )}
                        {quoteRequest.status === "rejected" && (
                          <XCircle size={16} />
                        )}
                        {quoteRequest.status === "expired" && (
                          <AlertTriangle size={16} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {getStatusConfig(quoteRequest.status).label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getStatusConfig(quoteRequest.status).description}
                        </p>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Send size={16} className="mr-2" />
                          Renvoyer au client
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Renvoyer le devis</DialogTitle>
                          <DialogDescription>
                            Un email sera envoyé au client pour l'informer que
                            son devis est disponible.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Message personnalisé (facultatif)</Label>
                            <Textarea placeholder="Ajoutez un message personnalisé qui sera inclus dans l'email..." />
                          </div>

                          <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                            <div className="flex items-start">
                              <Info className="h-4 w-4 mr-2 mt-0.5" />
                              <div>
                                <p className="font-medium">Information</p>
                                <p className="mt-1">
                                  Un email sera envoyé à{" "}
                                  {quoteRequest.userEmail} avec un lien vers le
                                  devis.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {}}>
                            Annuler
                          </Button>
                          <Button
                            onClick={() => {
                              toast.success("Email envoyé", {
                                description: `Un email a été envoyé à ${quoteRequest.userEmail}`,
                                duration: 3000,
                              });
                            }}
                          >
                            Envoyer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Bouton pour créer un nouveau devis */
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  Aucune proposition créée
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Cette demande de devis n'a pas encore de proposition
                  commerciale. Créez une proposition détaillée pour le client.
                </p>
                <Button onClick={() => setShowQuoteForm(true)}>
                  <Plus size={18} className="mr-2" />
                  Créer une proposition
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet communication client */}
        <TabsContent value="communication">
          <div className="grid grid-cols-1 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Communication avec le client</CardTitle>
                <CardDescription>
                  Envoyez un message au client concernant son devis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Écrivez votre message au client..."
                      value={clientMessage}
                      onChange={(e) => setClientMessage(e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={sendClientMessage}
                      disabled={!clientMessage.trim()}
                    >
                      <Send size={16} className="mr-2" />
                      Envoyer un email
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Historique des communications</Label>
                    <div className="bg-muted/30 p-4 rounded-lg text-center text-muted-foreground">
                      <p>
                        Aucune communication enregistrée avec ce client pour ce
                        devis.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Modèles de messages</CardTitle>
                <CardDescription>
                  Utilisez des modèles prédéfinis pour communiquer avec le
                  client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => {
                        setClientMessage(
                          "Bonjour,\n\nNous avons bien reçu votre demande de devis et nous vous remercions de votre confiance. Nous sommes en train d'analyser votre demande et reviendrons vers vous très prochainement avec une proposition détaillée.\n\nCordialement,\nL'équipe ChezFlora"
                        );
                      }}
                    >
                      <div className="flex items-start">
                        <Clock
                          size={16}
                          className="mr-2 mt-0.5 text-blue-600"
                        />
                        <div className="text-left">
                          <span className="font-medium">
                            Accusé de réception
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Confirmer la réception de la demande de devis
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="ml-auto" />
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => {
                        setClientMessage(
                          "Bonjour,\n\nNous sommes heureux de vous informer que votre devis est maintenant disponible dans votre espace client. Vous pouvez le consulter en vous connectant à votre compte.\n\nSi vous avez des questions, n'hésitez pas à nous contacter.\n\nCordialement,\nL'équipe ChezFlora"
                        );
                      }}
                    >
                      <div className="flex items-start">
                        <FileText
                          size={16}
                          className="mr-2 mt-0.5 text-green-600"
                        />
                        <div className="text-left">
                          <span className="font-medium">Devis disponible</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Informer le client que son devis est prêt
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="ml-auto" />
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => {
                        setClientMessage(
                          "Bonjour,\n\nNous aimerions avoir quelques précisions supplémentaires concernant votre demande de devis. Pourriez-vous nous donner plus de détails sur [préciser la question] ?\n\nCes informations nous permettront de vous proposer une solution parfaitement adaptée à vos besoins.\n\nCordialement,\nL'équipe ChezFlora"
                        );
                      }}
                    >
                      <div className="flex items-start">
                        <Search
                          size={16}
                          className="mr-2 mt-0.5 text-purple-600"
                        />
                        <div className="text-left">
                          <span className="font-medium">
                            Demande de précisions
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Demander des informations complémentaires
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="ml-auto" />
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => {
                        setClientMessage(
                          "Bonjour,\n\nNous vous rappelons que le devis que nous vous avons proposé expire prochainement, le [date d'expiration]. Si vous souhaitez donner suite à cette proposition, nous vous invitons à vous connecter à votre espace client pour l'accepter.\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\nL'équipe ChezFlora"
                        );
                      }}
                    >
                      <div className="flex items-start">
                        <AlertTriangle
                          size={16}
                          className="mr-2 mt-0.5 text-yellow-600"
                        />
                        <div className="text-left">
                          <span className="font-medium">
                            Rappel d'expiration
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Rappeler la date limite de validité du devis
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="ml-auto" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminQuoteDetail;
