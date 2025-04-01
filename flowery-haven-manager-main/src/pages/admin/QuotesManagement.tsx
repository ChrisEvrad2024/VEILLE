// src/pages/admin/QuotesManagement.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Printer, 
  Download, 
  MoreHorizontal, 
  ArrowUpDown, 
  Clock, 
  Mail, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  PenTool,
  ChevronRight,
  Building,
  Heart,
  Cake,
  Home,
  Flower,
  Trophy,
  Sparkles,
  Calendar,
  DollarSign,
  X,
  Info,
  User,
  FileText,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { quoteService, QuoteRequest, QuoteStatus } from "@/services/quote.service";
import { authService } from "@/services/auth.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Interface pour les filtres
interface QuoteFilters {
  status: QuoteStatus | 'all';
  search: string;
  timeframe: 'all' | 'today' | 'last7days' | 'last30days' | 'all_time';
  sortBy: 'date-desc' | 'date-asc' | 'budget-desc' | 'budget-asc';
}

const QuotesManagement = () => {
  const navigate = useNavigate();
  
  // États pour les devis
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<QuoteRequest[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedQuotes, setDisplayedQuotes] = useState<QuoteRequest[]>([]);
  
  // État pour les dialogues
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [quoteToUpdate, setQuoteToUpdate] = useState<QuoteRequest | null>(null);
  const [newStatus, setNewStatus] = useState<QuoteStatus>('in_review');
  const [statusNote, setStatusNote] = useState("");
  
  // État pour les filtres
  const [filters, setFilters] = useState<QuoteFilters>({
    status: 'all',
    search: '',
    timeframe: 'all',
    sortBy: 'date-desc'
  });
  
  // Statistiques des devis
  const [stats, setStats] = useState({
    totalQuoteRequests: 0,
    totalQuotes: 0,
    conversionRate: 0,
    quoteRequestsByStatus: {
      pending: 0,
      in_review: 0,
      awaiting_customer: 0,
      accepted: 0,
      rejected: 0,
      expired: 0
    }
  });
  
  // Chargement des devis
  useEffect(() => {
    const loadQuotes = async () => {
      setIsLoading(true);
      
      try {
        // Vérifier si l'utilisateur est un administrateur
        if (!authService.isAuthenticated() || !authService.isAdmin()) {
          navigate('/auth/login?redirect=/admin/quotes');
          return;
        }
        
        // Charger toutes les demandes de devis
        const allQuoteRequests = await quoteService.getAllQuoteRequests();
        setQuoteRequests(allQuoteRequests);
        
        // Appliquer les filtres initiaux
        applyFilters(allQuoteRequests, filters);
        
        // Charger les statistiques
        const statistics = await quoteService.getQuoteStatistics();
        setStats(statistics);
      } catch (error) {
        console.error('Error loading quote requests:', error);
        toast.error('Erreur lors du chargement des demandes de devis');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuotes();
  }, [navigate]);
  
  // Appliquer les filtres et la pagination
  const applyFilters = (quoteList: QuoteRequest[], currentFilters: QuoteFilters) => {
    let result = [...quoteList];
    
    // Filtre par statut
    if (currentFilters.status !== 'all') {
      result = result.filter(quote => quote.status === currentFilters.status);
    }
    
    // Filtre par recherche (ID, client, etc.)
    if (currentFilters.search.trim()) {
      const searchTerm = currentFilters.search.toLowerCase();
      result = result.filter(quote => 
        quote.id.toLowerCase().includes(searchTerm) ||
        quote.userName.toLowerCase().includes(searchTerm) ||
        quote.userEmail.toLowerCase().includes(searchTerm) ||
        quote.userPhone.toLowerCase().includes(searchTerm) ||
        quote.description.toLowerCase().includes(searchTerm) ||
        quote.eventType.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtre par période
    const now = new Date();
    if (currentFilters.timeframe !== 'all') {
      let dateLimit: Date;
      
      switch (currentFilters.timeframe) {
        case 'today':
          dateLimit = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'last7days':
          dateLimit = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'last30days':
          dateLimit = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          dateLimit = new Date(0); // Début de l'époque Unix
      }
      
      result = result.filter(quote => new Date(quote.createdAt) >= dateLimit);
    }
    
    // Tri
    switch (currentFilters.sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'budget-desc':
        result.sort((a, b) => b.budget - a.budget);
        break;
      case 'budget-asc':
        result.sort((a, b) => a.budget - b.budget);
        break;
      default:
        break;
    }
    
    setFilteredQuotes(result);
    setTotalPages(Math.ceil(result.length / itemsPerPage));
    setCurrentPage(1); // Réinitialiser à la première page après filtrage
    updateDisplayedQuotes(result, 1, itemsPerPage);
  };
  
  // Mettre à jour les demandes de devis affichées selon la pagination
  const updateDisplayedQuotes = (quotes: QuoteRequest[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    setDisplayedQuotes(quotes.slice(startIndex, endIndex));
  };
  
  // Gestionnaires de filtres
  const handleFilterChange = (key: keyof QuoteFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(quoteRequests, newFilters);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', e.target.value);
  };
  
  const resetFilters = () => {
    const defaultFilters: QuoteFilters = {
      status: 'all',
      search: '',
      timeframe: 'all',
      sortBy: 'date-desc'
    };
    
    setFilters(defaultFilters);
    applyFilters(quoteRequests, defaultFilters);
  };
  
  // Gestionnaire de pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateDisplayedQuotes(filteredQuotes, page, itemsPerPage);
  };
  
  // Sélection des devis
  const toggleSelectQuote = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId)
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedQuotes.length === displayedQuotes.length) {
      setSelectedQuotes([]);
    } else {
      setSelectedQuotes(displayedQuotes.map(quote => quote.id));
    }
  };
  
  // Formatter la date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(dateString));
  };
  
  // Obtenir la configuration pour un statut
  const getStatusConfig = (status: QuoteStatus) => {
    return quoteService.getQuoteStatusConfig(status);
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
  
  // Ouvrir le dialogue de mise à jour de statut
  const openStatusDialog = (quote: QuoteRequest) => {
    setQuoteToUpdate(quote);
    setNewStatus(quote.status === 'pending' ? 'in_review' : 
                quote.status === 'in_review' ? 'awaiting_customer' : quote.status);
    setStatusNote("");
    setStatusDialogOpen(true);
  };
  
  // Mettre à jour le statut d'une demande de devis
  const updateQuoteStatus = async () => {
    if (!quoteToUpdate || !newStatus) return;
    
    try {
      const result = await quoteService.updateQuoteRequestStatus(
        quoteToUpdate.id,
        newStatus,
        statusNote
      );
      
      if (result.success) {
        toast.success("Statut mis à jour", {
          description: `La demande de devis ${quoteToUpdate.id.substring(0, 8).toUpperCase()} a été mise à jour avec succès.`,
          duration: 3000
        });
        
        // Mettre à jour la liste des demandes de devis
        const updatedQuoteRequest = await quoteService.getQuoteRequestById(quoteToUpdate.id);
        if (updatedQuoteRequest) {
          setQuoteRequests(prev => 
            prev.map(quote => 
              quote.id === updatedQuoteRequest.id ? updatedQuoteRequest : quote
            )
          );
          
          // Réappliquer les filtres
          const updatedQuotes = quoteRequests.map(quote => 
            quote.id === updatedQuoteRequest.id ? updatedQuoteRequest : quote
          );
          applyFilters(updatedQuotes, filters);
          
          // Mettre à jour les statistiques
          const statistics = await quoteService.getQuoteStatistics();
          setStats(statistics);
        }
        
        setStatusDialogOpen(false);
      } else {
        toast.error("Erreur", {
          description: result.message,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error updating quote request status:', error);
      toast.error("Une erreur est survenue lors de la mise à jour du statut");
    }
  };
  
  // Actions en masse sur les devis sélectionnés
  const bulkChangeStatus = async (status: QuoteStatus) => {
    if (selectedQuotes.length === 0) {
      toast.error("Aucune demande de devis sélectionnée");
      return;
    }
    
    try {
      let successCount = 0;
      
      for (const quoteId of selectedQuotes) {
        const result = await quoteService.updateQuoteRequestStatus(
          quoteId,
          status,
          `Mise à jour en masse du statut à ${getStatusConfig(status).label}`
        );
        
        if (result.success) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} demande(s) mise(s) à jour`, {
          description: `${successCount} demande(s) sur ${selectedQuotes.length} ont été mise(s) à jour.`,
          duration: 3000
        });
        
        // Recharger les demandes de devis
        const allQuoteRequests = await quoteService.getAllQuoteRequests();
        setQuoteRequests(allQuoteRequests);
        applyFilters(allQuoteRequests, filters);
        
        // Mettre à jour les statistiques
        const statistics = await quoteService.getQuoteStatistics();
        setStats(statistics);
        
        // Réinitialiser la sélection
        setSelectedQuotes([]);
      } else {
        toast.error("Aucune demande n'a pu être mise à jour");
      }
    } catch (error) {
      console.error('Error bulk updating quote requests:', error);
      toast.error("Une erreur est survenue lors de la mise à jour des demandes");
    }
  };
  
  // Simuler l'impression ou l'export
  const handlePrint = () => {
    toast.success("Impression des demandes de devis", {
      description: "Les demandes sélectionnées sont en cours d'impression",
      duration: 3000
    });
  };
  
  const handleExport = () => {
    toast.success("Export des demandes de devis", {
      description: "Les demandes sélectionnées sont en cours d'export au format CSV",
      duration: 3000
    });
  };
  
  // Simuler l'envoi d'un email
  const handleSendEmail = () => {
    if (selectedQuotes.length === 0) {
      toast.error("Aucune demande de devis sélectionnée");
      return;
    }
    
    toast.success(`Email envoyé à ${selectedQuotes.length} client(s)`, {
      description: "Les notifications ont été envoyées avec succès",
      duration: 3000
    });
  };
  
  // Créer un devis en réponse à une demande
  const createQuoteReply = (quoteId: string) => {
    // Naviguer vers le formulaire de création de devis avec l'identifiant de la demande
    navigate(`/admin/quotes/create?requestId=${quoteId}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestion des Devis</h1>
        <p className="text-muted-foreground">
          Visualisez et gérez les demandes de devis de vos clients.
        </p>
      </div>
      
      {/* Statistiques des devis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Demandes de devis
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuoteRequests}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Chargement...' : `${stats.quoteRequestsByStatus.pending} en attente`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Devis créés
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotes}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Chargement...' : 'Propositions envoyées'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de conversion
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.conversionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Chargement...' : 'Devis acceptés / envoyés'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Devis en attente réponse
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quoteRequestsByStatus.awaiting_customer}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Chargement...' : 'En attente de décision client'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Vue par statut */}
      <Tabs defaultValue="all" onValueChange={(value) => handleFilterChange('status', value === 'all' ? 'all' : value as QuoteStatus)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            Tous ({stats.totalQuoteRequests})
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({stats.quoteRequestsByStatus.pending})
          </TabsTrigger>
          <TabsTrigger value="in_review">
            En analyse ({stats.quoteRequestsByStatus.in_review})
          </TabsTrigger>
          <TabsTrigger value="awaiting_customer">
            Attente client ({stats.quoteRequestsByStatus.awaiting_customer})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Acceptés ({stats.quoteRequestsByStatus.accepted})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Refusés ({stats.quoteRequestsByStatus.rejected})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={filters.status}>
          {/* Barre de filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une demande, un client..."
                className="pl-8"
                value={filters.search}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.timeframe}
                onValueChange={(value) => handleFilterChange('timeframe', value as QuoteFilters['timeframe'])}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="last7days">7 derniers jours</SelectItem>
                  <SelectItem value="last30days">30 derniers jours</SelectItem>
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
                  <SelectItem value="date-desc">Date (récent à ancien)</SelectItem>
                  <SelectItem value="date-asc">Date (ancien à récent)</SelectItem>
                  <SelectItem value="budget-desc">Budget (haut à bas)</SelectItem>
                  <SelectItem value="budget-asc">Budget (bas à haut)</SelectItem>
                </SelectContent>
              </Select>
              
              {(filters.search !== '' || filters.timeframe !== 'all' || filters.sortBy !== 'date-desc') && (
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
          
          {/* Actions en masse */}
          {selectedQuotes.length > 0 && (
            <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md mb-4">
              <div className="text-sm">
                <span className="font-medium">{selectedQuotes.length}</span> demande(s) sélectionnée(s)
              </div>
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Changer le statut
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Définir comme</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => bulkChangeStatus('in_review')}>
                      <Clock className="mr-2 h-4 w-4 text-blue-600" />
                      En cours d'analyse
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkChangeStatus('awaiting_customer')}>
                      <Mail className="mr-2 h-4 w-4 text-purple-600" />
                      En attente de réponse
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkChangeStatus('expired')}>
                      <AlertCircle className="mr-2 h-4 w-4 text-gray-600" />
                      Expiré
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer
                </Button>
                
                <Button variant="outline" size="sm" onClick={handleSendEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer email
                </Button>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="bg-white dark:bg-gray-950 rounded-md border shadow-sm p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Aucune demande de devis trouvée</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Nous n'avons trouvé aucune demande correspondant à vos critères.
              </p>
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="rounded-md border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]">
                      <Checkbox
                        checked={selectedQuotes.length > 0 && selectedQuotes.length === displayedQuotes.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Sélectionner toutes les demandes"
                      />
                    </TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type d'événement</TableHead>
                    <TableHead>Date de l'événement</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedQuotes.includes(quote.id)}
                          onCheckedChange={() => toggleSelectQuote(quote.id)}
                          aria-label={`Sélectionner la demande ${quote.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">#{quote.id.substring(0, 8).toUpperCase()}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(quote.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {quote.userName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {quote.userEmail || quote.userPhone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="bg-primary/10 p-1 rounded mr-2">
                            {getEventTypeIcon(quote.eventType)}
                          </div>
                          <span>{translateEventType(quote.eventType)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(quote.eventDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {quote.budget.toLocaleString()} XAF
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/quotes/${quote.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openStatusDialog(quote)}>
                              <Clock className="mr-2 h-4 w-4" />
                              Modifier le statut
                            </DropdownMenuItem>
                            {(quote.status === 'in_review' || quote.status === 'pending') && (
                              <DropdownMenuItem onClick={() => createQuoteReply(quote.id)}>
                                <PenTool className="mr-2 h-4 w-4" />
                                Créer un devis
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Envoyer un e-mail
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                          isActive={currentPage > 1}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = index + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + index;
                        } else {
                          pageNumber = currentPage - 2 + index;
                        }
                        
                        if (pageNumber <= totalPages) {
                          return (
                            <PaginationItem key={index}>
                              <PaginationLink
                                isActive={currentPage === pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                          isActive={currentPage < totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Dialogue de mise à jour du statut */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le statut de la demande</DialogTitle>
            <DialogDescription>
              Demande #{quoteToUpdate?.id.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Nouveau statut</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as QuoteStatus)}
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
                    <SelectItem value="in_review">
                      <div className="flex items-center">
                        <Search className="mr-2 h-4 w-4 text-blue-600" />
                        En cours d'analyse
                      </div>
                    </SelectItem>
                    <SelectItem value="awaiting_customer">
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-purple-600" />
                        En attente de réponse client
                      </div>
                    </SelectItem>
                    <SelectItem value="expired">
                      <div className="flex items-center">
                        <AlertCircle className="mr-2 h-4 w-4 text-gray-600" />
                        Expiré
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
              
              {newStatus === 'awaiting_customer' && (
                <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Un devis est nécessaire</p>
                      <p className="mt-1">
                        Ce statut signifie qu'un devis a été créé et envoyé au client. Assurez-vous d'avoir créé un devis avant de changer le statut.
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
            <Button
              onClick={updateQuoteStatus}
            >
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotesManagement;