// src/pages/account/QuoteHistory.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronRight,
  Calendar,
  DollarSign,
  Mail,
  Building,
  Heart,
  Cake,
  Home,
  Flower,
  Trophy,
  Sparkles,
  X
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { quoteService, QuoteRequest, QuoteStatus, Quote } from "@/services/quote.service";
import { authService } from "@/services/auth.service";

// Types pour les filtres
interface QuoteFilters {
  status: QuoteStatus | 'all';
  search: string;
  timeframe: 'all' | 'last30days' | 'last3months' | 'last6months';
  sortBy: 'recent' | 'oldest';
}

const QuoteHistory = () => {
  const navigate = useNavigate();
  
  // État pour les demandes de devis et les devis
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<(QuoteRequest | Quote)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtres
  const [filters, setFilters] = useState<QuoteFilters>({
    status: 'all',
    search: '',
    timeframe: 'all',
    sortBy: 'recent'
  });
  
  // Chargement des devis
  useEffect(() => {
    const loadQuotes = async () => {
      setIsLoading(true);
      
      try {
        // Vérifier l'authentification
        if (!authService.isAuthenticated()) {
          navigate('/auth/login?redirect=/account/quotes');
          return;
        }
        
        const user = authService.getCurrentUser();
        if (!user) {
          throw new Error('Utilisateur non trouvé');
        }
        
        // Charger les demandes de devis de l'utilisateur
        const userQuoteRequests = await quoteService.getQuoteRequestsByUser(user.id);
        setQuoteRequests(userQuoteRequests);
        
        // TODO: Charger les devis associés aux demandes
        // Pour l'instant, nous simulons cela avec un tableau vide
        setQuotes([]);
        
        // Appliquer les filtres initiaux
        applyFilters([...userQuoteRequests, ...quotes], filters);
      } catch (error) {
        console.error('Error loading quotes:', error);
        toast.error('Erreur lors du chargement des devis');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuotes();
  }, [navigate]);
  
  // Appliquer les filtres
  const applyFilters = (quotesList: (QuoteRequest | Quote)[], currentFilters: QuoteFilters) => {
    let result = [...quotesList];
    
    // Filtre par statut
    if (currentFilters.status !== 'all') {
      result = result.filter(quote => quote.status === currentFilters.status);
    }
    
    // Filtre par recherche
    if (currentFilters.search.trim()) {
      const searchTerm = currentFilters.search.toLowerCase();
      result = result.filter(quote => 
        quote.id.toLowerCase().includes(searchTerm) ||
        ('description' in quote && quote.description.toLowerCase().includes(searchTerm)) ||
        ('eventType' in quote && quote.eventType.toLowerCase().includes(searchTerm))
      );
    }
    
    // Filtre par période
    const now = new Date();
    if (currentFilters.timeframe !== 'all') {
      let dateLimit: Date;
      
      switch (currentFilters.timeframe) {
        case 'last30days':
          dateLimit = new Date(now.setDate(now.getDate() - 30));
          break;
        case 'last3months':
          dateLimit = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'last6months':
          dateLimit = new Date(now.setMonth(now.getMonth() - 6));
          break;
        default:
          dateLimit = new Date(0); // Début de l'époque Unix
      }
      
      result = result.filter(quote => new Date(quote.createdAt) >= dateLimit);
    }
    
    // Tri
    switch (currentFilters.sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        break;
    }
    
    setFilteredQuotes(result);
  };
  
  // Gestionnaires de filtres
  const handleFilterChange = (key: keyof QuoteFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters([...quoteRequests, ...quotes], newFilters);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', e.target.value);
  };
  
  const resetFilters = () => {
    const defaultFilters: QuoteFilters = {
      status: 'all',
      search: '',
      timeframe: 'all',
      sortBy: 'recent'
    };
    
    setFilters(defaultFilters);
    applyFilters([...quoteRequests, ...quotes], defaultFilters);
  };
  
  // Formater la date
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
        return <Heart size={16} />;
      case 'birthday':
        return <Cake size={16} />;
      case 'corporate':
        return <Building size={16} />;
      case 'funeral':
        return <Flower size={16} />;
      case 'graduation':
        return <Trophy size={16} />;
      case 'housewarming':
        return <Home size={16} />;
      default:
        return <Sparkles size={16} />;
    }
  };
  
  // Obtenir la configuration pour un statut
  const getStatusConfig = (status: QuoteStatus) => {
    return quoteService.getQuoteStatusConfig(status);
  };
  
  // Déterminer si un devis est une demande ou une proposition
  const isQuoteRequest = (quote: QuoteRequest | Quote): quote is QuoteRequest => {
    return 'eventType' in quote;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif">Mes demandes de devis</h1>
        <p className="text-muted-foreground">
          Consultez et suivez l'historique de vos demandes de devis et propositions.
        </p>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un devis..."
            className="pl-8"
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="in_review">En cours d'analyse</SelectItem>
              <SelectItem value="awaiting_customer">En attente de réponse</SelectItem>
              <SelectItem value="accepted">Accepté</SelectItem>
              <SelectItem value="rejected">Refusé</SelectItem>
              <SelectItem value="expired">Expiré</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.timeframe}
            onValueChange={(value) => handleFilterChange('timeframe', value as QuoteFilters['timeframe'])}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les demandes</SelectItem>
              <SelectItem value="last30days">30 derniers jours</SelectItem>
              <SelectItem value="last3months">3 derniers mois</SelectItem>
              <SelectItem value="last6months">6 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange('sortBy', value as QuoteFilters['sortBy'])}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récentes</SelectItem>
              <SelectItem value="oldest">Plus anciennes</SelectItem>
            </SelectContent>
          </Select>
          
          {(filters.status !== 'all' || filters.search !== '' || filters.timeframe !== 'all' || filters.sortBy !== 'recent') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1"
            >
              <X size={14} />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>
      
      {/* Bouton de nouvelle demande */}
      <div className="flex justify-between items-center">
        <Button asChild>
          <Link to="/quote-request" className="gap-2">
            <Plus size={16} />
            Nouvelle demande
          </Link>
        </Button>
        
        {/* Indicateur de filtres actifs et compteur */}
        {(filters.status !== 'all' || filters.search !== '' || filters.timeframe !== 'all') && (
          <div className="text-sm text-muted-foreground">
            {filteredQuotes.length} résultat{filteredQuotes.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Aucune demande de devis trouvée</h3>
            <p className="text-muted-foreground mt-1 text-center">
              {filters.status !== 'all' || filters.search !== '' || filters.timeframe !== 'all' 
                ? "Aucune demande ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore fait de demande de devis."}
            </p>
            <div className="flex gap-3 mt-6">
              {(filters.status !== 'all' || filters.search !== '' || filters.timeframe !== 'all') && (
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              )}
              <Button asChild>
                <Link to="/quote-request">Faire une demande</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => {
            if (isQuoteRequest(quote)) {
              // C'est une demande de devis
              return (
                <Card key={quote.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          Demande #{quote.id.substring(0, 8).toUpperCase()}
                        </CardTitle>
                        <Badge 
                          variant="outline"
                          className={`
                            ${quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                            ${quote.status === 'in_review' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                            ${quote.status === 'awaiting_customer' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}
                            ${quote.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                            ${quote.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                            ${quote.status === 'expired' ? 'bg-gray-100 text-gray-800 border-gray-200' : ''}
                          `}
                        >
                          {getStatusConfig(quote.status).label}
                        </Badge>
                      </div>
                      <CardDescription>
                        {formatDate(quote.createdAt)}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="bg-primary/10 p-1.5 rounded flex items-center justify-center">
                          {getEventTypeIcon(quote.eventType)}
                        </div>
                        <span className="ml-2 text-sm">
                          {quote.eventType === 'wedding' && 'Mariage'}
                          {quote.eventType === 'birthday' && 'Anniversaire'}
                          {quote.eventType === 'corporate' && 'Événement d\'entreprise'}
                          {quote.eventType === 'funeral' && 'Funérailles'}
                          {quote.eventType === 'graduation' && 'Remise de diplôme'}
                          {quote.eventType === 'housewarming' && 'Pendaison de crémaillère'}
                          {quote.eventType === 'other' && 'Autre'}
                        </span>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                          <div className="text-sm">
                            <span className="text-muted-foreground">Date de l'événement:</span>
                            <span className="font-medium ml-1">
                              {formatDate(quote.eventDate)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                          <div className="text-sm">
                            <span className="text-muted-foreground">Budget:</span>
                            <span className="font-medium ml-1">
                              {quote.budget.toLocaleString()} XAF
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                          <div className="text-sm">
                            <span className="text-muted-foreground">Validité:</span>
                            <span className="font-medium ml-1">
                              {quote.expiresAt ? formatDate(quote.expiresAt) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Informations sur le statut */}
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="flex items-start">
                          {quote.status === 'pending' && <Clock size={16} className="text-yellow-600 mr-2 mt-0.5" />}
                          {quote.status === 'in_review' && <Search size={16} className="text-blue-600 mr-2 mt-0.5" />}
                          {quote.status === 'awaiting_customer' && <Mail size={16} className="text-purple-600 mr-2 mt-0.5" />}
                          {quote.status === 'accepted' && <CheckCircle size={16} className="text-green-600 mr-2 mt-0.5" />}
                          {quote.status === 'rejected' && <XCircle size={16} className="text-red-600 mr-2 mt-0.5" />}
                          {quote.status === 'expired' && <AlertTriangle size={16} className="text-gray-600 mr-2 mt-0.5" />}
                          
                          <div className="text-sm">
                            <p className="font-medium">{getStatusConfig(quote.status).description}</p>
                            
                            {quote.status === 'pending' && (
                              <p className="text-muted-foreground mt-1">
                                Nous traiterons votre demande dans les 24-48h.
                              </p>
                            )}
                            
                            {quote.status === 'in_review' && (
                              <p className="text-muted-foreground mt-1">
                                Notre équipe prépare un devis personnalisé pour vous.
                              </p>
                            )}
                            
                            {quote.status === 'awaiting_customer' && (
                              <p className="text-muted-foreground mt-1">
                                Vous avez reçu une proposition ! Consultez-la pour plus de détails.
                              </p>
                            )}
                            
                            {quote.status === 'expired' && (
                              <p className="text-muted-foreground mt-1">
                                Ce devis a expiré le {quote.expiresAt && formatDate(quote.expiresAt)}.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    <Button
                      asChild
                      variant="default"
                      className="flex-1 min-w-[120px]"
                    >
                      <Link to={`/quote-detail/${quote.id}`}>
                        Voir les détails
                        <ChevronRight size={16} className="ml-1" />
                      </Link>
                    </Button>
                    
                    {quote.status === 'awaiting_customer' && (
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1 min-w-[120px]"
                      >
                        <Link to={`/quote-detail/${quote.id}`}>
                          Répondre à la proposition
                        </Link>
                      </Button>
                    )}
                    
                    {quote.status === 'pending' && (
                      <Button
                        variant="outline"
                        className="flex-1 min-w-[120px]"
                        asChild
                      >
                        <Link to={`/quote-request?edit=${quote.id}`}>
                          Modifier la demande
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            } else {
              // C'est une proposition de devis (future implémentation)
              return null;
            }
          })}
        </div>
      )}
    </div>
  );
};

export default QuoteHistory;