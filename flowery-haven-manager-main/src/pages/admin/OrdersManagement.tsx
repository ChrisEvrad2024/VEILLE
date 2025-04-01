// src/pages/admin/OrdersManagement.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PrintService } from "@/services/print.service";
import {
  Search,
  Filter,
  Printer,
  Download,
  MoreHorizontal,
  ArrowUpDown,
  Clock,
  Package,
  TruckIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Pencil,
  ChevronRight,
  Eye,
  DollarSign,
  Calendar,
  X,
  Mail,
  User,
  ShoppingBag,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { orderService, Order, OrderStatus } from "@/services/order.service";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
interface OrderFilters {
  status: OrderStatus | "all";
  search: string;
  timeframe: "all" | "today" | "last7days" | "last30days" | "last3months";
  sortBy: "date-desc" | "date-asc" | "total-desc" | "total-asc";
}

const handlePrint = () => {
  if (selectedOrders.length === 0) {
    toast.error("Aucune commande sélectionnée");
    return;
  }

  // Pour chaque commande sélectionnée, générer une facture
  const selectedOrdersData = orders.filter((order) =>
    selectedOrders.includes(order.id)
  );

  // Générer un rapport d'expédition si plusieurs commandes sont sélectionnées
  if (selectedOrdersData.length > 1) {
    PrintService.generateShippingReport(selectedOrdersData);
  } else if (selectedOrdersData.length === 1) {
    // Sinon, générer une facture pour la commande unique
    PrintService.generateInvoice(selectedOrdersData[0]);
  }

  toast.success(`Impression des ${selectedOrdersData.length} commande(s)`, {
    description: "Les documents ont été générés et téléchargés",
    duration: 3000,
  });
};

// Exporter les commandes sélectionnées
const handleExport = () => {
  if (selectedOrders.length === 0) {
    toast.error("Aucune commande sélectionnée");
    return;
  }

  // Pour chaque commande sélectionnée, générer une facture PDF
  const selectedOrdersData = orders.filter((order) =>
    selectedOrders.includes(order.id)
  );
  selectedOrdersData.forEach((order) => {
    PrintService.generateInvoice(order);
  });

  toast.success(`Export des ${selectedOrdersData.length} commande(s)`, {
    description: "Les factures ont été générées et téléchargées",
    duration: 3000,
  });
};

const OrdersManagement = () => {
  const navigate = useNavigate();

  // États pour les commandes
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);

  // État pour les dialogues
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [statusNote, setStatusNote] = useState("");

  // État pour les filtres
  const [filters, setFilters] = useState<OrderFilters>({
    status: "all",
    search: "",
    timeframe: "all",
    sortBy: "date-desc",
  });

  // Statistiques des commandes
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    ordersByStatus: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
    },
  });

  // Chargement des commandes
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);

      try {
        // Vérifier si l'utilisateur est un administrateur
        if (!authService.isAuthenticated() || !authService.isAdmin()) {
          navigate("/auth/login?redirect=/admin/orders");
          return;
        }

        // Charger toutes les commandes
        const allOrders = await orderService.getAllOrders();
        setOrders(allOrders);

        // Appliquer les filtres initiaux
        applyFilters(allOrders, filters);

        // Charger les statistiques
        const statistics = await orderService.getOrdersStatistics();
        setStats(statistics);
      } catch (error) {
        console.error("Error loading orders:", error);
        toast.error("Erreur lors du chargement des commandes");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [navigate]);

  // Appliquer les filtres et la pagination
  const applyFilters = (orderList: Order[], currentFilters: OrderFilters) => {
    let result = [...orderList];

    // Filtre par statut
    if (currentFilters.status !== "all") {
      result = result.filter((order) => order.status === currentFilters.status);
    }

    // Filtre par recherche (ID, client, etc.)
    if (currentFilters.search.trim()) {
      const searchTerm = currentFilters.search.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm) ||
          (
            order.shippingAddress.firstName +
            " " +
            order.shippingAddress.lastName
          )
            .toLowerCase()
            .includes(searchTerm) ||
          order.shippingAddress.email?.toLowerCase().includes(searchTerm) ||
          order.shippingAddress.phone.toLowerCase().includes(searchTerm) ||
          order.items.some(
            (item) =>
              item.name.toLowerCase().includes(searchTerm) ||
              item.productId.toLowerCase().includes(searchTerm)
          )
      );
    }

    // Filtre par période
    const now = new Date();
    if (currentFilters.timeframe !== "all") {
      let dateLimit: Date;

      switch (currentFilters.timeframe) {
        case "today":
          dateLimit = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "last7days":
          dateLimit = new Date(now.setDate(now.getDate() - 7));
          break;
        case "last30days":
          dateLimit = new Date(now.setDate(now.getDate() - 30));
          break;
        case "last3months":
          dateLimit = new Date(now.setMonth(now.getMonth() - 3));
          break;
        default:
          dateLimit = new Date(0); // Début de l'époque Unix
      }

      result = result.filter((order) => new Date(order.createdAt) >= dateLimit);
    }

    // Tri
    switch (currentFilters.sortBy) {
      case "date-desc":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "date-asc":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "total-desc":
        result.sort((a, b) => b.total - a.total);
        break;
      case "total-asc":
        result.sort((a, b) => a.total - b.total);
        break;
      default:
        break;
    }

    setFilteredOrders(result);
    setTotalPages(Math.ceil(result.length / itemsPerPage));
    setCurrentPage(1); // Réinitialiser à la première page après filtrage
    updateDisplayedOrders(result, 1, itemsPerPage);
  };

  // Mettre à jour les commandes affichées selon la pagination
  const updateDisplayedOrders = (
    orders: Order[],
    page: number,
    perPage: number
  ) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    setDisplayedOrders(orders.slice(startIndex, endIndex));
  };

  // Gestionnaires de filtres
  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(orders, newFilters);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange("search", e.target.value);
  };

  const resetFilters = () => {
    const defaultFilters: OrderFilters = {
      status: "all",
      search: "",
      timeframe: "all",
      sortBy: "date-desc",
    };

    setFilters(defaultFilters);
    applyFilters(orders, defaultFilters);
  };

  // Gestionnaire de pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateDisplayedOrders(filteredOrders, page, itemsPerPage);
  };

  // Sélection des commandes
  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === displayedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(displayedOrders.map((order) => order.id));
    }
  };

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

  // Ouvrir le dialogue de mise à jour de statut
  const openStatusDialog = (order: Order) => {
    setOrderToUpdate(order);
    setNewStatus(
      order.status === "pending"
        ? "processing"
        : order.status === "processing"
        ? "shipped"
        : order.status === "shipped"
        ? "delivered"
        : order.status
    );
    setStatusNote("");
    setStatusDialogOpen(true);
  };

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async () => {
    if (!orderToUpdate || !newStatus) return;

    try {
      const result = await orderService.updateOrderStatus(
        orderToUpdate.id,
        newStatus,
        statusNote
      );

      if (result.success) {
        toast.success("Statut mis à jour", {
          description: `La commande ${orderToUpdate.id
            .substring(0, 8)
            .toUpperCase()} a été mise à jour avec succès.`,
          duration: 3000,
        });

        // Mettre à jour la liste des commandes
        const updatedOrder = await orderService.getOrderById(orderToUpdate.id);
        if (updatedOrder) {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === updatedOrder.id ? updatedOrder : order
            )
          );

          // Réappliquer les filtres
          const updatedOrders = orders.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          );
          applyFilters(updatedOrders, filters);

          // Mettre à jour les statistiques
          const statistics = await orderService.getOrdersStatistics();
          setStats(statistics);
        }

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
    }
  };

  // Actions en masse sur les commandes sélectionnées
  const bulkChangeStatus = async (status: OrderStatus) => {
    if (selectedOrders.length === 0) {
      toast.error("Aucune commande sélectionnée");
      return;
    }

    try {
      let successCount = 0;

      for (const orderId of selectedOrders) {
        const result = await orderService.updateOrderStatus(
          orderId,
          status,
          `Mise à jour en masse du statut à ${getStatusConfig(status).label}`
        );

        if (result.success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} commande(s) mise(s) à jour`, {
          description: `${successCount} commande(s) sur ${selectedOrders.length} ont été mise(s) à jour.`,
          duration: 3000,
        });

        // Recharger les commandes
        const allOrders = await orderService.getAllOrders();
        setOrders(allOrders);
        applyFilters(allOrders, filters);

        // Mettre à jour les statistiques
        const statistics = await orderService.getOrdersStatistics();
        setStats(statistics);

        // Réinitialiser la sélection
        setSelectedOrders([]);
      } else {
        toast.error("Aucune commande n'a pu être mise à jour");
      }
    } catch (error) {
      console.error("Error bulk updating orders:", error);
      toast.error(
        "Une erreur est survenue lors de la mise à jour des commandes"
      );
    }
  };

  // Simuler l'impression ou l'export
  const handlePrint = () => {
    toast.success("Impression des commandes", {
      description: "Les commandes sélectionnées sont en cours d'impression",
      duration: 3000,
    });
  };

  const handleExport = () => {
    toast.success("Export des commandes", {
      description:
        "Les commandes sélectionnées sont en cours d'export au format CSV",
      duration: 3000,
    });
  };

  // Simuler l'envoi d'un email
  const handleSendEmail = () => {
    if (selectedOrders.length === 0) {
      toast.error("Aucune commande sélectionnée");
      return;
    }

    toast.success(`Email envoyé à ${selectedOrders.length} client(s)`, {
      description: "Les notifications ont été envoyées avec succès",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gestion des Commandes
        </h1>
        <p className="text-muted-foreground">
          Visualisez et gérez les commandes de vos clients.
        </p>
      </div>

      {/* Statistiques des commandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total des commandes
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Chargement..."
                : `${stats.ordersByStatus.pending} en attente`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chiffre d'affaires
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue.toLocaleString()} XAF
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Chargement..." : "Commandes finalisées"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À expédier</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.ordersByStatus.processing}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Chargement..." : "Commandes en traitement"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En livraison</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.ordersByStatus.shipped}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Chargement..." : "Commandes expédiées"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vue par statut */}
      <Tabs
        defaultValue="all"
        onValueChange={(value) =>
          handleFilterChange(
            "status",
            value === "all" ? "all" : (value as OrderStatus)
          )
        }
      >
        <TabsList className="mb-6">
          <TabsTrigger value="all">Toutes ({stats.totalOrders})</TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({stats.ordersByStatus.pending})
          </TabsTrigger>
          <TabsTrigger value="processing">
            En traitement ({stats.ordersByStatus.processing})
          </TabsTrigger>
          <TabsTrigger value="shipped">
            Expédiées ({stats.ordersByStatus.shipped})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Livrées ({stats.ordersByStatus.delivered})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Annulées ({stats.ordersByStatus.cancelled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filters.status}>
          {/* Barre de filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une commande, un client..."
                className="pl-8"
                value={filters.search}
                onChange={handleSearch}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.timeframe}
                onValueChange={(value) =>
                  handleFilterChange(
                    "timeframe",
                    value as OrderFilters["timeframe"]
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="last7days">7 derniers jours</SelectItem>
                  <SelectItem value="last30days">30 derniers jours</SelectItem>
                  <SelectItem value="last3months">3 derniers mois</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  handleFilterChange("sortBy", value as OrderFilters["sortBy"])
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">
                    Date (récent à ancien)
                  </SelectItem>
                  <SelectItem value="date-asc">
                    Date (ancien à récent)
                  </SelectItem>
                  <SelectItem value="total-desc">
                    Montant (haut à bas)
                  </SelectItem>
                  <SelectItem value="total-asc">
                    Montant (bas à haut)
                  </SelectItem>
                </SelectContent>
              </Select>

              {(filters.search !== "" ||
                filters.timeframe !== "all" ||
                filters.sortBy !== "date-desc") && (
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
          {selectedOrders.length > 0 && (
            <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md mb-4">
              <div className="text-sm">
                <span className="font-medium">{selectedOrders.length}</span>{" "}
                commande(s) sélectionnée(s)
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
                    <DropdownMenuItem
                      onClick={() => bulkChangeStatus("processing")}
                    >
                      <Package className="mr-2 h-4 w-4 text-blue-600" />
                      En traitement
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => bulkChangeStatus("shipped")}
                    >
                      <TruckIcon className="mr-2 h-4 w-4 text-purple-600" />
                      Expédiée
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => bulkChangeStatus("delivered")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Livrée
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => bulkChangeStatus("cancelled")}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                      Annulée
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
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-gray-950 rounded-md border shadow-sm p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Aucune commande trouvée
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Nous n'avons trouvé aucune commande correspondant à vos
                critères.
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
                        checked={
                          selectedOrders.length > 0 &&
                          selectedOrders.length === displayedOrders.length
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Sélectionner toutes les commandes"
                      />
                    </TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleSelectOrder(order.id)}
                          aria-label={`Sélectionner la commande ${order.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.length} article(s)
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {order.shippingAddress.firstName}{" "}
                          {order.shippingAddress.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.shippingAddress.email ||
                            order.shippingAddress.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleTimeString(
                            "fr-FR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
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
                            ${
                              order.status === "refunded"
                                ? "bg-gray-100 text-gray-800 border-gray-200"
                                : ""
                            }
                          `}
                        >
                          {getStatusConfig(order.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {order.total.toLocaleString()} XAF
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
                              <Link to={`/admin/orders/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openStatusDialog(order)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier le statut
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                const order = orders.find(
                                  (o) => o.id === order.id
                                );
                                if (order) {
                                  PrintService.generateInvoice(order);
                                  toast.success("Facture générée", {
                                    description:
                                      "La facture a été téléchargée avec succès",
                                    duration: 3000,
                                  });
                                }
                              }}
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimer la facture
                            </DropdownMenuItem>
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
                          onClick={() =>
                            handlePageChange(Math.max(1, currentPage - 1))
                          }
                          isActive={currentPage > 1}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, totalPages) }).map(
                        (_, index) => {
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
                        }
                      )}

                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
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
            <DialogTitle>Modifier le statut de la commande</DialogTitle>
            <DialogDescription>
              Commande #{orderToUpdate?.id.substring(0, 8).toUpperCase()}
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
                      <p className="font-medium">Informations de suivi</p>
                      <p className="mt-1">
                        En changeant le statut à "Expédiée", des informations de
                        suivi seront automatiquement générées et envoyées au
                        client.
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
            <Button onClick={updateOrderStatus}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
