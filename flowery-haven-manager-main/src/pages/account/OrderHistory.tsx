// src/pages/account/OrderHistory.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  Package, 
  TruckIcon, 
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  LayoutList,
  LayoutGrid,
  ShoppingBag,
  Download,
  History,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { orderService, Order, OrderStatus } from "@/services/order.service";
import { authService } from "@/services/auth.service";

// Type pour les filtres
interface OrderFilters {
  status: OrderStatus | 'all';
  search: string;
  timeframe: 'all' | 'last30days' | 'last3months' | 'last6months';
  sortBy: 'recent' | 'oldest' | 'high' | 'low';
}

const OrderHistory = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Filtres
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    search: '',
    timeframe: 'all',
    sortBy: 'recent'
  });
  
  // Charger les commandes
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      
      try {
        // Vérifier l'authentification
        if (!authService.isAuthenticated()) {
          navigate('/auth/login?redirect=/account/orders');
          return;
        }
        
        const user = authService.getCurrentUser();
        if (!user) {
          throw new Error('Utilisateur non trouvé');
        }
        
        const userOrders = await orderService.getOrdersByUser(user.id);
        setOrders(userOrders);
        applyFilters(userOrders, filters);
      } catch (error) {
        console.error('Error loading orders:', error);
        toast.error('Erreur lors du chargement des commandes');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, [navigate]);
  
  // Appliquer les filtres
  const applyFilters = (ordersList: Order[], currentFilters: OrderFilters) => {
    let result = [...ordersList];
    
    // Filtre par statut
    if (currentFilters.status !== 'all') {
      result = result.filter(order => order.status === currentFilters.status);
    }
    
    // Filtre par recherche (id, nom des articles, etc.)
    if (currentFilters.search.trim()) {
      const searchTerm = currentFilters.search.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(searchTerm) ||
        order.items.some(item => 
          item.name.toLowerCase().includes(searchTerm) ||
          item.productId.toLowerCase().includes(searchTerm)
        ) ||
        (order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName)
          .toLowerCase()
          .includes(searchTerm)
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
      
      result = result.filter(order => new Date(order.createdAt) >= dateLimit);
    }
    
    // Tri
    switch (currentFilters.sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'high':
        result.sort((a, b) => b.total - a.total);
        break;
      case 'low':
        result.sort((a, b) => a.total - b.total);
        break;
      default:
        break;
    }
    
    setFilteredOrders(result);
  };
  
  // Gestionnaires de filtres
  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(orders, newFilters);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', e.target.value);
  };
  
  const resetFilters = () => {
    const defaultFilters: OrderFilters = {
      status: 'all',
      search: '',
      timeframe: 'all',
      sortBy: 'recent'
    };
    
    setFilters(defaultFilters);
    applyFilters(orders, defaultFilters);
  };
  
  // Formater la date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  };
  
  // Récupérer la configuration pour le statut
  const getStatusConfig = (status: OrderStatus) => {
    return orderService.getOrderStatusConfig(status);
  };
  
  // Annuler une commande
  const cancelOrder = async (orderId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      return;
    }
    
    try {
      const result = await orderService.cancelOrder(
        orderId, 
        "Annulation à la demande du client"
      );
      
      if (result.success) {
        toast.success("Commande annulée", {
          description: "Votre commande a été annulée avec succès",
          duration: 3000
        });
        
        // Mettre à jour la liste des commandes
        const updatedOrder = await orderService.getOrderById(orderId);
        if (updatedOrder) {
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === orderId ? updatedOrder : order
            )
          );
          applyFilters(
            orders.map(order => order.id === orderId ? updatedOrder : order),
            filters
          );
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
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif">Mes commandes</h1>
        <p className="text-muted-foreground">
          Consultez et suivez l'historique de vos commandes.
        </p>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une commande..."
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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="processing">En traitement</SelectItem>
              <SelectItem value="shipped">Expédiée</SelectItem>
              <SelectItem value="delivered">Livrée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.timeframe}
            onValueChange={(value) => handleFilterChange('timeframe', value as OrderFilters['timeframe'])}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les commandes</SelectItem>
              <SelectItem value="last30days">30 derniers jours</SelectItem>
              <SelectItem value="last3months">3 derniers mois</SelectItem>
              <SelectItem value="last6months">6 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange('sortBy', value as OrderFilters['sortBy'])}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récentes</SelectItem>
              <SelectItem value="oldest">Plus anciennes</SelectItem>
              <SelectItem value="high">Montant: élevé à bas</SelectItem>
              <SelectItem value="low">Montant: bas à élevé</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-1 lg:ml-2 border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode('list')}
            >
              <LayoutList size={16} />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </Button>
          </div>
          
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
      
      {/* Indicateur de filtre actif */}
      {(filters.status !== 'all' || filters.search !== '' || filters.timeframe !== 'all') && (
        <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium mr-2">Filtres actifs:</span>
            {filters.status !== 'all' && (
              <Badge variant="outline" className="mr-2 bg-background">
                Statut: {getStatusConfig(filters.status as OrderStatus).label}
              </Badge>
            )}
            {filters.search !== '' && (
              <Badge variant="outline" className="mr-2 bg-background">
                Recherche: "{filters.search}"
              </Badge>
            )}
            {filters.timeframe !== 'all' && (
              <Badge variant="outline" className="mr-2 bg-background">
                Période: {
                  filters.timeframe === 'last30days' ? '30 derniers jours' :
                  filters.timeframe === 'last3months' ? '3 derniers mois' : 
                  '6 derniers mois'
                }
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredOrders.length} résultat{filteredOrders.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

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
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Aucune commande trouvée</h3>
            <p className="text-muted-foreground mt-1 text-center">
              {filters.status !== 'all' || filters.search !== '' || filters.timeframe !== 'all' 
                ? "Aucune commande ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore passé de commande."}
            </p>
            <div className="flex gap-3 mt-6">
              {(filters.status !== 'all' || filters.search !== '' || filters.timeframe !== 'all') && (
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              )}
              <Button asChild>
                <Link to="/catalog">Commencer vos achats</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center">
                      <span className="mr-2">Commande #{order.id.substring(0, 8).toUpperCase()}</span>
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
                    </CardTitle>
                    <CardDescription>
                      {formatDate(order.createdAt)} • {order.items.length} article{order.items.length > 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="font-medium">{order.total.toFixed(2)} XAF</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {/* Order items - limited to 2 in grid view */}
                <div className="space-y-4">
                  {order.items.slice(0, viewMode === 'grid' ? 2 : order.items.length).map((item) => (
                    <div key={item.productId} className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantité: {item.quantity} × {item.price.toFixed(2)} XAF
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* "Plus d'articles" indicator for grid view */}
                  {viewMode === 'grid' && order.items.length > 2 && (
                    <div className="text-sm text-muted-foreground italic">
                      + {order.items.length - 2} article{order.items.length - 2 > 1 ? 's' : ''} supplémentaire{order.items.length - 2 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                {/* Tracking info if available */}
                {order.trackingInfo && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-md text-sm">
                    <div className="flex items-center">
                      <TruckIcon size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground mr-2">Suivi:</span>
                      <a 
                        href={order.trackingInfo.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {order.trackingInfo.carrier} - {order.trackingInfo.trackingNumber}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/10 p-4 flex flex-wrap gap-2">
                <Button
                  asChild
                  variant="default"
                  className="flex-1 min-w-[120px]"
                >
                  <Link to={`/order-detail/${order.id}`}>
                    Voir les détails
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </Button>
                
                {/* Actions contextuelles selon le statut */}
                {order.status === 'pending' || order.status === 'processing' ? (
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[120px]"
                    onClick={() => cancelOrder(order.id)}
                  >
                    Annuler
                  </Button>
                ) : order.status === 'shipped' ? (
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[120px]"
                    asChild
                  >
                    <a 
                      href={order.trackingInfo?.url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Suivre
                    </a>
                  </Button>
                ) : order.status === 'delivered' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 min-w-[120px]"
                      >
                        Plus d'actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <Download size={14} className="mr-2" />
                        Télécharger facture
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <RefreshCw size={14} className="mr-2" />
                        Commander à nouveau
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[120px]"
                  >
                    <RefreshCw size={14} className="mr-2" />
                    Commander à nouveau
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;