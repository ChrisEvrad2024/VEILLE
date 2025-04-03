// src/pages/account/QuoteDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
  MessageSquare
} from "lucide-react";
import { quoteService, QuoteRequest, QuoteStatus, Quote, QuoteItem } from "@/services/quote.service";
import { authService } from "@/services/auth.service";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Input } from "@/components/ui/input";
import { OrderAddress } from "@/services/order.service";

const QuoteDetail = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour les actions
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'accept' | 'reject'>('accept');
  
  // Adresse de livraison pour l'acceptation du devis
  const [shippingAddress, setShippingAddress] = useState<OrderAddress>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Cameroun",
    phone: "",
  });
  
  // Chargement du devis
  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId) {
        toast.error("ID de devis manquant");
        navigate('/account/quotes');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Vérifier l'authentification
        if (!authService.isAuthenticated()) {
          navigate('/auth/login?redirect=/quote-detail/' + quoteId);
          return;
        }
        
        // Charger la demande de devis
        const quoteReqData = await quoteService.getQuoteRequestById(quoteId);
        
        if (!quoteReqData) {
          toast.error("Devis introuvable");
          navigate('/account/quotes');
          return;
        }
        
        setQuoteRequest(quoteReqData);
        
        // Charger le devis associé (s'il existe)
        try {
          const quoteData = await quoteService.getQuoteById(quoteId);
          if (quoteData) {
            setQuote(quoteData);
          }
        } catch (error) {
          // Si aucun devis n'est trouvé, c'est normal pour les demandes en attente
          console.info('No quote found for this request yet');
        }
        
        // Pré-remplir l'adresse de livraison avec les infos utilisateur
        const user = authService.getCurrentUser();
        if (user) {
          setShippingAddress({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: "Cameroun",
            phone: user.phone || "",
          });
        }
      } catch (error) {
        console.error('Error loading quote:', error);
        toast.error('Erreur lors du chargement du devis');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuote();
  }, [quoteId, navigate]);
  
  // Formatter la date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  };
  
  // Obtenir l'icône pour un type d'événement
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'wedding':
        return <Heart size={20} />;
      case 'birthday':
        return <Cake size={20} />;
      case 'corporate':
        return <Building size={20} />;
      case 'funeral':
        return <Flower size={20} />;
      case 'graduation':
        return <Trophy size={20} />;
      case 'housewarming':
        return <Home size={20} />;
      default:
        return <Sparkles size={20} />;
    }
  };
  
  // Traduire le type d'événement
  const translateEventType = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'wedding':
        return 'Mariage';
      case 'birthday':
        return 'Anniversaire';
      case 'corporate':
        return 'Événement d\'entreprise';
      case 'funeral':
        return 'Funérailles';
      case 'graduation':
        return 'Remise de diplôme';
      case 'housewarming':
        return 'Pendaison de crémaillère';
      default:
        return 'Autre';
    }
  };
  
  // Obtenir la configuration pour un statut
  const getStatusConfig = (status: QuoteStatus) => {
    return quoteService.getQuoteStatusConfig(status);
  };
  
  // Gérer l'acceptation du devis
  const handleAcceptQuote = async () => {
    if (!quoteId || !quote) return;
    
    // Vérifier que tous les champs d'adresse sont remplis
    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'postalCode', 'phone'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field as keyof OrderAddress]);
    
    if (missingFields.length > 0) {
      toast.error("Veuillez remplir tous les champs d'adresse requis");
      return;
    }
    
    setIsAccepting(true);
    
    try {
      const result = await quoteService.acceptQuote(
        quoteId,
        shippingAddress
      );
      
      if (result.success) {
        setDialogOpen(false);
        
        toast.success("Devis accepté", {
          description: "Votre commande a été créée avec succès",
          duration: 3000
        });
        
        // Rediriger vers la page de confirmation de commande
        if (result.orderId) {
          navigate(`/order-confirmation/${result.orderId}`);
        } else {
          // Recharger le devis pour mettre à jour son statut
          const updatedQuote = await quoteService.getQuoteById(quoteId);
          if (updatedQuote) {
            setQuote(updatedQuote);
          }
        }
      } else {
        toast.error("Erreur", {
          description: result.message,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast.error("Une erreur est survenue lors de l'acceptation du devis");
    } finally {
      setIsAccepting(false);
    }
  };
  
  // Gérer le rejet du devis
  const handleRejectQuote = async () => {
    if (!quoteId || !quote) return;
    
    if (!rejectionReason.trim()) {
      toast.error("Veuillez indiquer une raison de refus");
      return;
    }
    
    setIsRejecting(true);
    
    try {
      const result = await quoteService.rejectQuote(
        quoteId,
        rejectionReason
      );
      
      if (result.success) {
        setDialogOpen(false);
        
        toast.success("Devis refusé", {
          description: "Le devis a été refusé avec succès",
          duration: 3000
        });
        
        // Recharger le devis pour mettre à jour son statut
        const updatedQuote = await quoteService.getQuoteById(quoteId);
        if (updatedQuote) {
          setQuote(updatedQuote);
        }
      } else {
        toast.error("Erreur", {
          description: result.message,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error rejecting quote:', error);
      toast.error("Une erreur est survenue lors du refus du devis");
    } finally {
      setIsRejecting(false);
      setRejectionReason("");
    }
  };
  
  // Ouvrir le dialogue avec l'action appropriée
  const openDialog = (action: 'accept' | 'reject') => {
    setDialogAction(action);
    setDialogOpen(true);
  };
  
  // Simuler l'impression du devis
  const printQuote = () => {
    toast.success("Impression du devis", {
      description: "Le devis est en cours d'impression"
    });
  };
  
  // Simuler le téléchargement du devis en PDF
  const downloadQuote = () => {
    toast.success("Téléchargement du devis", {
      description: "Le devis est en cours de téléchargement en PDF"
    });
  };
  
  const calculateTimeRemaining = () => {
    if (!quote) return null;
    
    const validUntil = new Date(quote.validUntil);
    const now = new Date();
    
    if (validUntil < now) return "Expiré";
    
    const diffTime = Math.abs(validUntil.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
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
                  
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  // Si la demande de devis n'existe pas
  if (!quoteRequest) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-16 min-h-screen">
          <div className="container max-w-4xl mx-auto px-4 lg:px-8 text-center">
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6 inline-block">
              <FileText size={32} />
            </div>
            <h1 className="text-2xl font-serif mb-4">Devis introuvable</h1>
            <p className="text-muted-foreground mb-8">
              Nous n'avons pas trouvé le devis que vous recherchez. Il a peut-être été supprimé ou l'identifiant est incorrect.
            </p>
            <Button asChild>
              <Link to="/account/quotes">
                Voir mes devis
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
          {/* Retour aux devis */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <Button
              variant="ghost"
              className="mb-4 sm:mb-0 w-fit p-0 h-auto font-normal hover:bg-transparent hover:underline"
              onClick={() => navigate('/account/quotes')}
            >
              <ChevronLeft size={16} className="mr-1" />
              Retour à mes devis
            </Button>
            
            {/* Actions supplémentaires pour les devis */}
            {quote && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadQuote}
                  className="gap-1"
                >
                  <Download size={14} />
                  Télécharger
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={printQuote}
                  className="gap-1"
                >
                  <Printer size={14} />
                  Imprimer
                </Button>
              </div>
            )}
          </div>
          
          {/* En-tête du devis */}
          <div className="mb-8">
            <h1 className="text-2xl font-serif flex items-center gap-2 mb-1">
              Devis #{quoteId?.substring(0, 8).toUpperCase()}
              <Badge 
                variant="outline"
                className={`
                  ${quoteRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                  ${quoteRequest.status === 'in_review' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                  ${quoteRequest.status === 'awaiting_customer' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                  ${quoteRequest.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                  ${quoteRequest.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                  ${quoteRequest.status === 'expired' ? 'bg-gray-100 text-gray-800 border-gray-200' : ''}
                `}
              >
                {getStatusConfig(quoteRequest.status).label}
              </Badge>
            </h1>
            <p className="text-muted-foreground flex items-center">
              <Calendar size={16} className="mr-2" />
              Demande créée le {formatDate(quoteRequest.createdAt)}
            </p>
          </div>
          
          <div className="space-y-8">
            {/* Onglets d'information */}
            <Tabs defaultValue={quote ? "quote" : "request"}>
              <TabsList className="mb-6">
                <TabsTrigger value="request">Détail de la demande</TabsTrigger>
                {quote && <TabsTrigger value="quote">Proposition commerciale</TabsTrigger>}
              </TabsList>
              
              {/* Onglet de la demande */}
              <TabsContent value="request">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        {getEventTypeIcon(quoteRequest.eventType)}
                      </div>
                      {translateEventType(quoteRequest.eventType)}
                    </CardTitle>
                    <CardDescription>
                      Demande pour un événement le {formatDate(quoteRequest.eventDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Informations principales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Date de l'événement</Label>
                        <p className="font-medium">{formatDate(quoteRequest.eventDate)}</p>
                      </div>
                      
                      <div>
                        <Label className="text-muted-foreground text-sm">Budget</Label>
                        <p className="font-medium">{quoteRequest.budget.toLocaleString()} XAF</p>
                      </div>
                      
                      <div>
                        <Label className="text-muted-foreground text-sm">Statut actuel</Label>
                        <p className="font-medium">{getStatusConfig(quoteRequest.status).label}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Description détaillée */}
                    <div>
                      <Label className="text-muted-foreground text-sm">Description de la demande</Label>
                      <div className="mt-2 p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-line">
                        {quoteRequest.description}
                      </div>
                    </div>
                    
                    {/* Images jointes (s'il y en a) */}
                    {quoteRequest.attachments && quoteRequest.attachments.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Images d'inspiration</Label>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {quoteRequest.attachments.map((attachment, index) => (
                            <div key={index} className="aspect-square rounded-md overflow-hidden bg-muted border">
                              <img 
                                src={attachment} 
                                alt={`Image d'inspiration ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Coordonnées */}
                    <div>
                      <Label className="text-muted-foreground text-sm">Vos coordonnées</Label>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center">
                          <User size={16} className="text-muted-foreground mr-2" />
                          <span className="text-sm">{quoteRequest.userName}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Mail size={16} className="text-muted-foreground mr-2" />
                          <span className="text-sm">{quoteRequest.userEmail}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Phone size={16} className="text-muted-foreground mr-2" />
                          <span className="text-sm">{quoteRequest.userPhone}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col xs:flex-row gap-3">
                    {/* Boutons d'action selon le statut */}
                    {quoteRequest.status === 'pending' && (
                      <Button asChild className="w-full">
                        <Link to={`/quote-request?edit=${quoteRequest.id}`}>
                          <Pencil size={16} className="mr-2" />
                          Modifier ma demande
                        </Link>
                      </Button>
                    )}
                    
                    {quoteRequest.status === 'in_review' && (
                      <div className="text-sm text-center w-full p-3 bg-blue-50 text-blue-700 rounded-md">
                        <Search size={16} className="inline-block mr-2" />
                        Votre demande est en cours d'analyse. Nous reviendrons vers vous dans les plus brefs délais.
                      </div>
                    )}
                    
                    {quoteRequest.status === 'expired' && (
                      <Button asChild className="w-full">
                        <Link to="/quote-request">
                          <Plus size={16} className="mr-2" />
                          Faire une nouvelle demande
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Onglet du devis (si disponible) */}
              {quote && (
                <TabsContent value="quote">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <CardTitle>Proposition Commerciale</CardTitle>
                          <CardDescription>
                            Élaborée le {formatDate(quote.createdAt)} • Valide jusqu'au {formatDate(quote.validUntil)}
                          </CardDescription>
                        </div>
                        
                        {/* Validation restante */}
                        {quote.status === 'awaiting_customer' && (
                          <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-3 py-1 text-xs flex items-center">
                            <Clock size={12} className="mr-1" />
                            <span>Validité: {calculateTimeRemaining()}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Message d'introduction */}
                      {quote.notes && (
                        <div className="bg-primary/5 p-4 rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium">Message personnalisé:</span>
                          </p>
                          <p className="text-sm mt-1 italic">
                            "{quote.notes}"
                          </p>
                        </div>
                      )}
                      
                      {/* Détail des articles */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Détail de la proposition</h3>
                        <div className="rounded-lg border overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm">Description</th>
                                <th className="px-4 py-3 text-center text-sm">Quantité</th>
                                <th className="px-4 py-3 text-right text-sm">Prix unitaire</th>
                                <th className="px-4 py-3 text-right text-sm">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {quote.items.map((item, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-4">
                                    <div>
                                      <p className="font-medium">{item.name}</p>
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-center">{item.quantity}</td>
                                  <td className="px-4 py-4 text-right">{item.unitPrice.toLocaleString()} XAF</td>
                                  <td className="px-4 py-4 text-right font-medium">{item.total.toLocaleString()} XAF</td>
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
                            <span>{quote.subtotal.toLocaleString()} XAF</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">TVA (20%)</span>
                            <span>{quote.tax.toLocaleString()} XAF</span>
                          </div>
                          
                          {quote.discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Remise</span>
                              <span className="text-green-600">-{quote.discount.toLocaleString()} XAF</span>
                            </div>
                          )}
                          
                          <Separator />
                          
                          <div className="flex justify-between font-medium text-lg pt-2">
                            <span>Total TTC</span>
                            <span>{quote.total.toLocaleString()} XAF</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Conditions du devis */}
                      <Accordion type="single" collapsible>
                        <AccordionItem value="terms">
                          <AccordionTrigger>
                            Conditions et modalités
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 text-sm">
                              <p>
                                <span className="font-medium">Validité du devis:</span> Cette proposition est valable jusqu'au {formatDate(quote.validUntil)}.
                              </p>
                              
                              <p>
                                <span className="font-medium">Modalités de paiement:</span> Un acompte de 30% est requis à l'acceptation du devis. Le solde sera à régler à la livraison.
                              </p>
                              
                              <p>
                                <span className="font-medium">Livraison:</span> La livraison sera effectuée à l'adresse spécifiée le jour de l'événement, ou à une date convenue ensemble.
                              </p>
                              
                              <p>
                                <span className="font-medium">Modification ou annulation:</span> Toute modification importante ou annulation doit être communiquée au minimum 48h avant la date de livraison.
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                    <CardFooter className="flex flex-col xs:flex-row gap-3">
                      {/* Boutons d'action selon le statut */}
                      {quote.status === 'awaiting_customer' && (
                        <>
                          <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => openDialog('accept')}
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Accepter le devis
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => openDialog('reject')}
                          >
                            <XCircle size={16} className="mr-2" />
                            Refuser le devis
                          </Button>
                        </>
                      )}
                      
                      {quote.status === 'accepted' && (
                        <div className="text-sm text-center w-full p-3 bg-green-50 text-green-700 rounded-md">
                          <CheckCircle size={16} className="inline-block mr-2" />
                          Vous avez accepté ce devis le {formatDate(quote.updatedAt)}. Une commande a été créée.
                        </div>
                      )}
                      
                      {quote.status === 'rejected' && (
                        <div className="text-sm text-center w-full p-3 bg-red-50 text-red-700 rounded-md">
                          <XCircle size={16} className="inline-block mr-2" />
                          Vous avez refusé ce devis le {formatDate(quote.updatedAt)}.
                        </div>
                      )}
                      
                      {quote.status === 'expired' && (
                        <div className="text-sm text-center w-full p-3 bg-gray-50 text-gray-700 rounded-md">
                          <AlertTriangle size={16} className="inline-block mr-2" />
                          Ce devis a expiré le {formatDate(quote.validUntil)}.
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
            
            {/* Section de contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Besoin d'aide ?</CardTitle>
                <CardDescription>
                  Notre équipe est disponible pour répondre à vos questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="rounded-full bg-primary/10 p-3 mb-3">
                      <Mail size={18} className="text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">Par email</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Réponse sous 24h
                    </p>
                    <a href="mailto:devis@ChezFLORA.com" className="text-sm text-primary hover:underline">
                      devis@ChezFLORA.com
                    </a>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="rounded-full bg-primary/10 p-3 mb-3">
                      <Phone size={18} className="text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">Par téléphone</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Lun-Ven, 9h à 18h
                    </p>
                    <a href="tel:+237691234567" className="text-sm text-primary hover:underline">
                      +237 655 746 714
                    </a>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="rounded-full bg-primary/10 p-3 mb-3">
                      <MessageSquare size={18} className="text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">Chat en direct</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Assistance immédiate
                    </p>
                    <Button variant="outline" size="sm">
                      Démarrer un chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Dialogue pour accepter ou refuser un devis */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {dialogAction === 'accept' ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Accepter le devis
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                  Refuser le devis
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'accept' 
                ? "Veuillez confirmer l'acceptation du devis et fournir les informations de livraison nécessaires."
                : "Veuillez indiquer la raison de votre refus pour nous aider à améliorer nos services."}
            </DialogDescription>
          </DialogHeader>
          
          {dialogAction === 'accept' ? (
            <div className="py-4 space-y-4">
              <h3 className="text-sm font-medium">Adresse de livraison</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input 
                    id="firstName" 
                    value={shippingAddress.firstName}
                    onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input 
                    id="lastName" 
                    value={shippingAddress.lastName}
                    onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input 
                  id="address" 
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input 
                    id="city" 
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">Province/Région *</Label>
                  <Input 
                    id="state" 
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal *</Label>
                  <Input 
                    id="postalCode" 
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input 
                    id="phone" 
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
                <Info size={14} className="mr-2 flex-shrink-0" />
                <p>En acceptant ce devis, vous acceptez les conditions générales et les modalités de paiement spécifiées.</p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <Label htmlFor="rejectionReason" className="mb-2 block">
                Raison du refus
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Veuillez indiquer pourquoi vous refusez ce devis..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Annuler
            </Button>
            
            {dialogAction === 'accept' ? (
              <Button
                variant="default"
                onClick={handleAcceptQuote}
                disabled={isAccepting}
              >
                {isAccepting ? "Traitement..." : "Accepter et commander"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleRejectQuote}
                disabled={isRejecting}
              >
                {isRejecting ? "Traitement..." : "Confirmer le refus"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </>
  );
};

export default QuoteDetail;