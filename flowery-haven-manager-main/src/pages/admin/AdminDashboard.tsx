import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orderService } from "@/services/order.service";
import { userService } from "@/services/user.service";
import { productService } from "@/services/product.service";
import { 
  StatisticsWidget, 
  KpiCard 
} from "@/components/admin/StatisticsWidget";
import { 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Package,
  TrendingUp,
  Calendar,
  Truck,
  ArrowUpRight,
  AlertCircle,
  ClipboardList,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllProducts } from "@/lib/data";
import { Product } from "@/types/product";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  LowStockProductsCard, 
  PendingQuoteRequestsCard,
  AdminNotifications 
} from "@/components/admin/AdminDashboardAlerts";

const AdminDashboard = () => {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  
  // Définir les états pour les données de graphiques et tableaux
  const [recentOrdersData, setRecentOrdersData] = useState([
    { id: 'ORD-001', customer: 'Marie Dupont', date: '2023-06-05', amount: 59.99, status: 'Livré' },
    { id: 'ORD-002', customer: 'Jean Martin', date: '2023-06-04', amount: 124.50, status: 'En cours' },
    { id: 'ORD-003', customer: 'Sophie Bernard', date: '2023-06-03', amount: 45.75, status: 'Livré' },
    { id: 'ORD-004', customer: 'Thomas Robert', date: '2023-06-02', amount: 89.99, status: 'Préparation' },
    { id: 'ORD-005', customer: 'Laura Petit', date: '2023-06-01', amount: 35.50, status: 'Livré' },
  ]);
  
  const [monthlySales, setMonthlySales] = useState([
    { name: 'Jan', value: 1200 },
    { name: 'Fév', value: 1900 },
    { name: 'Mar', value: 1500 },
    { name: 'Avr', value: 2200 },
    { name: 'Mai', value: 2700 },
    { name: 'Juin', value: 2900 },
  ]);
  
  const [weeklyOrders, setWeeklyOrders] = useState([
    { name: 'Lun', value: 12 },
    { name: 'Mar', value: 19 },
    { name: 'Mer', value: 15 },
    { name: 'Jeu', value: 22 },
    { name: 'Ven', value: 27 },
    { name: 'Sam', value: 29 },
    { name: 'Dim', value: 18 },
  ]);
  
  const [topCategories, setTopCategories] = useState([
    { name: 'Bouquets', value: 42 },
    { name: 'Plantes', value: 28 },
    { name: 'Fleurs', value: 18 },
    { name: 'Déco', value: 12 },
  ]);
  
  const [customerSources, setCustomerSources] = useState([
    { name: 'Direct', value: 35 },
    { name: 'Social', value: 25 },
    { name: 'Search', value: 20 },
    { name: 'Referral', value: 15 },
    { name: 'Email', value: 5 },
  ]);
  
  const [pendingQuoteRequests, setPendingQuoteRequests] = useState([
    { id: 'QUO-001', customer: 'Entreprise ABC', date: '2023-06-05', type: 'Événement d\'entreprise', status: 'En attente' },
    { id: 'QUO-002', customer: 'Mariage Dupont', date: '2023-06-04', type: 'Mariage', status: 'En attente' },
    { id: 'QUO-003', customer: 'Restaurant Le Gourmet', date: '2023-06-03', type: 'Décoration', status: 'En attente' },
  ]);

  useEffect(() => {
    // Fonction pour charger toutes les données nécessaires
    const loadDashboardData = async () => {
      try {
        // 1. Chargement des produits
        const products = await productService.getAllProducts();
        setTotalProducts(products.length);
        
        // Filtrer les produits en stock faible (stock < 5)
        setLowStockProducts(products.filter(product => product.stock !== undefined && product.stock < 5));
        
        // 2. Chargement des statistiques de commandes
        const orderStats = await orderService.getOrdersStatistics();
        setTotalOrders(orderStats.totalOrders);
        setTotalRevenue(orderStats.totalRevenue);
        
        // 3. Chargement des clients
        try {
          const users = await userService.getAllUsers();
          setTotalCustomers(users.length);
        } catch (error) {
          console.warn("Impossible de charger les utilisateurs:", error);
          // Valeur par défaut si le service n'est pas disponible
        }
        
        // 4. Chargement des commandes récentes
        try {
          const allOrders = await orderService.getAllOrders();
          if (allOrders && allOrders.length > 0) {
            const recent = allOrders.slice(0, 5).map(order => ({
              id: order.id,
              customer: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
              date: order.createdAt,
              amount: order.total,
              status: order.status === 'delivered' ? 'Livré' : 
                     order.status === 'processing' ? 'En cours' : 
                     order.status === 'pending' ? 'Préparation' : order.status
            }));
            setRecentOrdersData(recent);
            
            // 5. Calculer les ventes mensuelles à partir des commandes
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            const currentMonth = new Date().getMonth();
            const salesByMonth = new Array(6).fill(0);
            
            // Calculer les 6 derniers mois de ventes
            allOrders.forEach(order => {
              const orderDate = new Date(order.createdAt);
              const monthDiff = currentMonth - orderDate.getMonth() + (new Date().getFullYear() - orderDate.getFullYear()) * 12;
              
              if (monthDiff >= 0 && monthDiff < 6 && order.status !== 'cancelled' && order.status !== 'refunded') {
                salesByMonth[5 - monthDiff] += order.total;
              }
            });
            
            // Créer les données pour le graphique
            const monthlySalesData = [];
            for (let i = 0; i < 6; i++) {
              const monthIndex = (currentMonth - 5 + i + 12) % 12; // Calcul des 6 derniers mois
              monthlySalesData.push({
                name: months[monthIndex],
                value: salesByMonth[i]
              });
            }
            setMonthlySales(monthlySalesData);
            
            // 6. Calculer les commandes hebdomadaires
            const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Lundi de cette semaine
            
            const weeklyOrdersData = daysOfWeek.map((day, index) => {
              const date = new Date(startOfWeek);
              date.setDate(startOfWeek.getDate() + index);
              
              // Compter les commandes pour ce jour
              const count = allOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getDate() === date.getDate() && 
                       orderDate.getMonth() === date.getMonth() && 
                       orderDate.getFullYear() === date.getFullYear();
              }).length;
              
              return { name: day, value: count };
            });
            
            setWeeklyOrders(weeklyOrdersData);
            
            // 7. Calculer les ventes par catégorie
            if (products.length > 0) {
              const categorySales = {};
              
              allOrders.forEach(order => {
                if (order.status !== 'cancelled' && order.status !== 'refunded') {
                  order.items.forEach(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (product) {
                      const category = product.category;
                      categorySales[category] = (categorySales[category] || 0) + (item.price * item.quantity);
                    }
                  });
                }
              });
              
              // Calculer les pourcentages et créer le tableau pour le graphique
              const totalSales = Object.values(categorySales).reduce((sum: any, val: any) => sum + val, 0);
              if (totalSales > 0) {
                const topCategoriesData = Object.entries(categorySales)
                  .map(([name, value]) => ({ 
                    name, 
                    value: Math.round((value as number) * 100 / totalSales) 
                  }))
                  .sort((a, b) => (b.value as number) - (a.value as number))
                  .slice(0, 4);
                
                if (topCategoriesData.length > 0) {
                  setTopCategories(topCategoriesData);
                }
              }
            }
          }
        } catch (error) {
          console.warn("Impossible de charger les commandes:", error);
          // On garde les valeurs par défaut
        }
        
      } catch (error) {
        console.error("Erreur lors du chargement des données du tableau de bord:", error);
      }
    };
    
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur le tableau de bord de votre boutique Floralie.</p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard 
              title="Ventes totales" 
              value={`${totalRevenue.toFixed(2)} XAF`} 
              icon={<CreditCard className="h-5 w-5 text-muted-foreground" />}
              change="12.5%"
              changeType="increase"
              changeLabel="vs mois dernier"
            />
            <KpiCard 
              title="Commandes" 
              value={totalOrders} 
              icon={<ShoppingBag className="h-5 w-5 text-muted-foreground" />}
              change="5.2%"
              changeType="increase"
              changeLabel="vs mois dernier"
            />
            <KpiCard 
              title="Clients" 
              value={totalCustomers} 
              icon={<Users className="h-5 w-5 text-muted-foreground" />}
              change="8.1%"
              changeType="increase"
              changeLabel="vs mois dernier"
            />
            <KpiCard 
              title="Produits" 
              value={totalProducts} 
              icon={<Package className="h-5 w-5 text-muted-foreground" />}
              change="2"
              changeType="increase"
              changeLabel="nouveaux"
            />
          </div>

          {/* New Sections: Recent Orders, Low Stock, Pending Quotes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <ShoppingBag className="mr-2 h-5 w-5" />
                      Commandes récentes
                    </CardTitle>
                    <CardDescription>
                      Les dernières commandes reçues
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
                      <TableHead>ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrdersData.slice(0, 4).map((order, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'Livré' ? 'default' :
                            order.status === 'En cours' ? 'secondary' :
                            'outline'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{order.amount.toFixed(2)} XAF</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pending Quote Requests */}
            <PendingQuoteRequestsCard quotes={pendingQuoteRequests} />
          </div>

          {/* Low Stock Products */}
          <LowStockProductsCard products={lowStockProducts} />
          
          {/* Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatisticsWidget 
                  title="Ventes mensuelles (XAF)" 
                  data={monthlySales} 
                  color="#22c55e"
                  valuePrefix="XAF"
                  chartType="line"
                />
                <StatisticsWidget 
                  title="Ventes par catégorie (%)" 
                  data={topCategories} 
                  color="#6366f1"
                  valueSuffix="%"
                  chartType="pie"
                />
              </div>
            </div>
            <div>
              <AdminNotifications />
            </div>
          </div>
          
          {/* Second Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatisticsWidget 
              title="Commandes hebdomadaires" 
              data={weeklyOrders} 
              color="#f59e0b"
              chartType="bar"
            />
            <StatisticsWidget 
              title="Sources clients" 
              data={customerSources} 
              color="#8b5cf6"
              valueSuffix="%"
              chartType="pie"
            />
          </div>
          
          {/* Recent Orders Table (Full) */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes récentes</CardTitle>
              <CardDescription>Les 5 dernières commandes de votre boutique.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {recentOrdersData.map((order, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{order.id}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{order.customer}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{order.date}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{order.amount.toFixed(2)} XAF</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'Livré' ? 'bg-green-100 text-green-700 border-green-300' :
                            order.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <Button variant="ghost" size="sm">Voir</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <KpiCard 
              title="Ventes aujourd'hui" 
              value="475.25 XAF" 
              icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
              change="12.5%"
              changeType="increase"
              changeLabel="vs hier"
            />
            <KpiCard 
              title="Commandes en attente" 
              value="8" 
              icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
            />
            <KpiCard 
              title="Livraisons en cours" 
              value="6" 
              icon={<Truck className="h-5 w-5 text-muted-foreground" />}
              change="2"
              changeType="increase"
              changeLabel="nouvelles"
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Analyse des ventes</CardTitle>
              <CardDescription>Consultez les indicateurs détaillés des ventes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <StatisticsWidget 
                  title="" 
                  data={monthlySales} 
                  color="#22c55e"
                  valuePrefix="XAF"
                  chartType="line"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Produits populaires</CardTitle>
                  <CardDescription>Les produits les plus vendus de votre boutique.</CardDescription>
                </div>
                <Button size="sm">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Voir tous
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Prix</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {/* <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">Bouquet Élégance Rose</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">Bouquets</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">59.99 XAF</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">24</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">Harmonie Printanière</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">Bouquets</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">49.99 XAF</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">18</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">Orchidée Zen</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">Plantes</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">69.99 XAF</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">15</td>
                    </tr> */}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aperçu des clients</CardTitle>
              <CardDescription>Statistiques et informations sur vos clients.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatisticsWidget 
                  title="Sources d'acquisition" 
                  data={customerSources} 
                  chartType="pie"
                  valueSuffix="%"
                />
                <div>
                  <h3 className="text-lg font-medium mb-4">Clients récents</h3>
                  <div className="space-y-4">
                    {['Sophie Martin', 'Thomas Dubois', 'Laura Petit'].map((name, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-sm text-muted-foreground">Client depuis {i+1} jour{i > 0 ? 's' : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;