import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Settings,
  ShoppingBag,
  MapPin,
  CreditCard,
  Heart,
  Clock,
  Bell,
  Gift,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCartItemCount } from "@/lib/cart";
import { wishlistAdapter } from "@/services/adapters";
import { authService } from "@/services/auth.service";

const MyAccount = () => {
  const [userData, setUserData] = useState<any>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Get user data
    const user = authService.getCurrentUser();
    if (user) {
      setUserData(user);
    }

    // Get wishlist and cart counts
    const updateCounts = async () => {
      try {
        const wishlist = await wishlistAdapter.getWishlist();
        setWishlistCount(wishlist.length);
        setCartCount(getCartItemCount());
      } catch (error) {
        console.error("Error updating counts:", error);
      }
    };
    
    updateCounts();

    // Update counts when localStorage changes
    const handleStorageChange = () => {
      updateCounts();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wishlistUpdated", handleStorageChange);
    window.addEventListener("cartUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wishlistUpdated", handleStorageChange);
      window.removeEventListener("cartUpdated", handleStorageChange);
    };
  }, []);

  // Account sections - main grid
  const accountCards = [
    {
      title: "Informations personnelles",
      description: "Gérez vos informations de profil et de connexion",
      icon: <User className="h-5 w-5" />,
      href: "/account/profile",
      color: "bg-blue-50",
    },
    {
      title: "Mes commandes",
      description: "Suivez vos commandes et l'historique d'achats",
      icon: <ShoppingBag className="h-5 w-5" />,
      href: "/account/orders",
      color: "bg-green-50",
    },
    {
      title: "Mes adresses",
      description: "Gérez vos adresses de livraison et de facturation",
      icon: <MapPin className="h-5 w-5" />,
      href: "/account/addresses",
      color: "bg-purple-50",
    },
    {
      title: "Mes devis",
      description: "Consultez et gérez vos demandes de devis personnalisés",
      icon: <FileText className="h-5 w-5" />,
      href: "/account/quotes",
      color: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-serif">
          Bonjour, {userData?.firstName || 'utilisateur'} 👋
        </h1>
        <p className="text-muted-foreground">
          Bienvenue dans votre espace personnel. Gérez vos informations,
          commandes et préférences.
        </p>
      </div>

      {/* Dashboard summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Panier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{cartCount}</div>
              <Link to="/cart">
                <Button variant="outline" size="sm">
                  Voir le panier
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Liste de souhaits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{wishlistCount}</div>
              <Link to="/wishlist">
                <Button variant="outline" size="sm">
                  Voir les favoris
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">0</div>
              <Link to="/account/orders">
                <Button variant="outline" size="sm">
                  Historique
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main account sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accountCards.map((card, index) => (
          <Link key={index} to={card.href}>
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div
                  className={`w-10 h-10 rounded-full ${card.color} flex items-center justify-center mb-2`}
                >
                  {card.icon}
                </div>
                <CardTitle className="text-xl">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="text-primary">
                  Gérer &rarr;
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MyAccount;