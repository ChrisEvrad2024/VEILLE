
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ChevronRight, 
  Package, 
  TruckIcon, 
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Sample order data (in a real app, this would come from an API)
const sampleOrders = [
  {
    id: "ORD-12345",
    date: "2024-03-15",
    status: "delivered",
    total: 85.90,
    items: [
      { id: 1, name: "Bouquet de roses rouges", price: 39.95, quantity: 1, image: "https://images.unsplash.com/photo-1559563362-c667ba5f5480?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
      { id: 2, name: "Vase en céramique", price: 45.95, quantity: 1, image: "https://images.unsplash.com/photo-1612196808214-75c49e6a8637?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" }
    ],
    tracking: {
      number: "TRK789012345",
      carrier: "Chronopost",
      url: "#"
    }
  },
  {
    id: "ORD-67890",
    date: "2024-02-28",
    status: "processing",
    total: 65.50,
    items: [
      { id: 3, name: "Bouquet de tulipes", price: 35.50, quantity: 1, image: "https://images.unsplash.com/photo-1588621394303-fd4829aecb65?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
      { id: 4, name: "Carte de vœux personnalisée", price: 5.00, quantity: 2, image: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
      { id: 5, name: "Chocolats assortis", price: 20.00, quantity: 1, image: "https://images.unsplash.com/photo-1611254655677-5ce4c5cd2dc5?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" }
    ]
  },
  {
    id: "ORD-54321",
    date: "2024-01-10",
    status: "cancelled",
    total: 29.95,
    items: [
      { id: 6, name: "Plante d'intérieur", price: 29.95, quantity: 1, image: "https://images.unsplash.com/photo-1463320898484-cdee8141c787?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" }
    ]
  }
];

// Status mapping for displaying appropriate UI
const statusConfig = {
  processing: {
    label: "En cours de traitement",
    color: "bg-blue-100 text-blue-800",
    icon: <Clock className="h-4 w-4" />
  },
  shipped: {
    label: "Expédiée",
    color: "bg-purple-100 text-purple-800",
    icon: <TruckIcon className="h-4 w-4" />
  },
  delivered: {
    label: "Livrée",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="h-4 w-4" />
  },
  cancelled: {
    label: "Annulée",
    color: "bg-red-100 text-red-800",
    icon: <AlertCircle className="h-4 w-4" />
  }
};

const OrderHistory = async () => {
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter orders based on active tab
  const filteredOrders = activeTab === "all" 
    ? sampleOrders 
    : sampleOrders.filter(order => order.status === activeTab);

  // Format date to French locale
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif">Mes commandes</h1>
        <p className="text-muted-foreground">
          Consultez et suivez l'historique de vos commandes.
        </p>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Toutes ({sampleOrders.length})</TabsTrigger>
          <TabsTrigger value="processing">En cours ({sampleOrders.filter(o => o.status === "processing").length})</TabsTrigger>
          <TabsTrigger value="delivered">Livrées ({sampleOrders.filter(o => o.status === "delivered").length})</TabsTrigger>
          <TabsTrigger value="cancelled">Annulées ({sampleOrders.filter(o => o.status === "cancelled").length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-base">Commande {order.id}</CardTitle>
                      <CardDescription>
                        {formatDate(order.date)} • {order.items.length} article{order.items.length > 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 md:mt-0">
                      <Badge 
                        variant="outline"
                        className={`${statusConfig[order.status as keyof typeof statusConfig].color} flex gap-1 items-center`}
                      >
                        {statusConfig[order.status as keyof typeof statusConfig].icon}
                        {statusConfig[order.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {/* Order items */}
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start space-x-4">
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
                            Quantité: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.price.toFixed(2)} €</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Order summary and actions */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Total: {order.total.toFixed(2)} €</p>
                      
                      {order.tracking && (
                        <a 
                          href={order.tracking.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center mt-1"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Suivre colis {order.tracking.carrier} ({order.tracking.number})
                        </a>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 mt-4 md:mt-0">
                      <Button variant="outline" size="sm">
                        Détails
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      {order.status !== "cancelled" && (
                        <Button variant="secondary" size="sm">
                          Assistance
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Aucune commande trouvée</h3>
                <p className="text-muted-foreground mt-1 text-center">
                  Vous n'avez pas encore de commandes dans cette catégorie.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/catalog">Commencer vos achats</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderHistory;
