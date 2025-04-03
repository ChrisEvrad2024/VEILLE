// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Package,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  BarChart,
  PieChart,
  ArrowUpRight,
  Eye
} from "lucide-react";
import { orderService } from "@/services/order.service";
import { productService } from "@/services/product.service";
import { LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  
  // Stats state
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    ordersToday: 0,
    salesGrowth: 12.5, // Placeholder value
    customerGrowth: 8.1, // Placeholder value
    lowStockProducts: 0
  });
  
  // Data state
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get stats and data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get orders and calculate stats
        const orders = await orderService.getAllOrders();
        const orderStats = await orderService.getOrdersStatistics();
        
        // Get products and calculate stats
        const products = await productService.getAllProducts();
        const lowStock = await productService.getLowStockProducts(5);
        
        // Calculate today's orders (simplified example)
        const today = new Date().toDateString();
        const todayOrders = orders.filter(order => 
          new Date(order.createdAt).toDateString() === today
        );
        
        // Set basic stats
        setStats({
          totalSales: orderStats.totalRevenue,
          totalOrders: orderStats.totalOrders,
          totalCustomers: 120, // Placeholder, would come from userService in real app
          totalProducts: products.length,
          ordersToday: todayOrders.length,
          salesGrowth: 12.5, // Placeholder
          customerGrowth: 8.1, // Placeholder
          lowStockProducts: lowStock.length
        });
        
        // Set recent orders
        setRecentOrders(orders.slice(0, 5).map(order => ({
          id: order.id.substring(0, 8).toUpperCase(),
          customer: order.shippingAddress?.firstName + ' ' + order.shippingAddress?.lastName,
          date: new Date(order.createdAt).toLocaleDateString(),
          amount: order.total,
          status: order.status
        })));
        
        // Set low stock products
        setLowStockItems(lowStock.slice(0, 5).map(product => ({
          id: product.id.substring(0, 8).toUpperCase(),
          name: product.name,
          stock: product.stock,
          price: product.price
        })));
        
        // Generate monthly sales data (in a real app this would come from a service)
        const months = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin'];
        const monthlySalesData = [
          { name: months[0], value: 2100 },
          { name: months[1], value: 1800 },
          { name: months[2], value: 2400 },
          { name: months[3], value: 2700 },
          { name: months[4], value: 3100 },
          { name: months[5], value: 3500 }
        ];
        setMonthlySales(monthlySalesData);
        
        // Generate weekly sales data
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const weeklySalesData = days.map(day => ({
          name: day,
          value: Math.floor(Math.random() * 30) + 10
        }));
        setWeeklySales(weeklySalesData);
        
        // Generate category data
        const categoryData = [
          { name: 'Bouquets', value: 40 },
          { name: 'Plantes', value: 30 },
          { name: 'Fleurs', value: 20 },
          { name: 'Déco', value: 10 }
        ];
        setCategoryData(categoryData);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    return value.toLocaleString() + ' XAF';
  };
  
  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
  
  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Livré</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Expédié</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">En cours</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">En attente</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue {user?.firstName || 'Administrateur'}. Voici les statistiques de votre boutique ChezFLORA.</p>
      </div>
      
      {/* Key metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventes totales
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 font-medium">+{stats.salesGrowth}%</span> vs mois dernier
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Commandes
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ordersToday} aujourd'hui
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500 font-medium">+{stats.customerGrowth}%</span> vs mois dernier
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produits
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-500 font-medium">{stats.lowStockProducts}</span> en stock faible
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs and content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Aperçu général</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly sales chart */}
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-primary" />
                  Ventes mensuelles
                </CardTitle>
                <CardDescription>
                  Évolution des ventes sur les 6 derniers mois
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySales} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} XAF`, 'Ventes']} />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Categories pie chart */}
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Ventes par catégorie
                </CardTitle>
                <CardDescription>
                  Répartition des ventes par catégorie de produits
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Pourcentage']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent orders and alerts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent orders */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      Commandes récentes
                    </CardTitle>
                    <CardDescription>
                      Les 5 dernières commandes reçues
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    Voir tout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(order.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Low stock products */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Produits en stock faible
                    </CardTitle>
                    <CardDescription>
                      Produits nécessitant un réapprovisionnement
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    Gérer le stock
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell className="text-right text-red-500 font-medium">{product.stock}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          {/* Weekly sales chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Commandes hebdomadaires
              </CardTitle>
              <CardDescription>
                Nombre de commandes par jour sur la semaine
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={weeklySales}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Commandes" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des commandes</CardTitle>
              <CardDescription>Visualisez et gérez toutes vos commandes depuis cette page</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-10">
              <div className="text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Accéder à la gestion complète des commandes</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Consultez toutes vos commandes, filtrez par statut, gérez les expéditions et plus encore.
                </p>
                <Button>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Voir toutes les commandes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des produits</CardTitle>
              <CardDescription>Gérez votre catalogue de produits</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-10">
              <div className="text-center">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Accéder au catalogue produits</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Ajoutez, modifiez ou supprimez des produits, gérez les catégories et les stocks.
                </p>
                <Button>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Gérer les produits
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des clients</CardTitle>
              <CardDescription>Consultez la liste de vos clients et leurs informations</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-10">
              <div className="text-center">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Accéder à la liste des clients</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Consultez les profils clients, l'historique des commandes et gérez les comptes.
                </p>
                <Button>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Voir les clients
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;