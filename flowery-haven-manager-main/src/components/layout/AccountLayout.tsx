
import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { User, Settings, ShoppingBag, MapPin, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AccountLayout =  () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const user = localStorage.getItem("user");
    
    if (!isAuthenticated || !user) {
      navigate("/auth/login", { state: { from: location.pathname } });
      toast.error("Veuillez vous connecter pour accéder à votre compte");
      return;
    }
    
    try {
      setUserData(JSON.parse(user));
    } catch (error) {
      console.error("Failed to parse user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location.pathname]);

  // Logout handler
  const handleLogout =  () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Chargement...</div>
      </div>
    );
  }

  // Navigation items for the sidebar
  const navigationItems = [
    { label: "Mon compte", href: "/account", icon: <User size={18} /> },
    { label: "Mes informations", href: "/account/profile", icon: <Settings size={18} /> },
    { label: "Mes commandes", href: "/account/orders", icon: <ShoppingBag size={18} /> },
    { label: "Mes adresses", href: "/account/addresses", icon: <MapPin size={18} /> }
  ];

  return (
    <>
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-8 pt-24 md:py-12 md:pt-32">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="space-y-1 md:sticky md:top-28">
              <div className="p-4 border rounded-lg mb-4">
                <h2 className="font-semibold">
                  {userData?.firstName} {userData?.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">{userData?.email}</p>
              </div>
              
              <nav className="space-y-1">
                {navigationItems.map((item) => (
                  <Link 
                    key={item.href} 
                    to={item.href}
                    className={`flex items-center gap-2 p-2 rounded-md hover:bg-muted w-full transition-colors ${
                      location.pathname === item.href ? "bg-muted font-medium" : ""
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
                <Separator className="my-2" />
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-destructive/10 w-full transition-colors text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Déconnexion
                </Button>
              </nav>
            </div>
          </div>
          
          {/* Main content */}
          <main className="md:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AccountLayout;
