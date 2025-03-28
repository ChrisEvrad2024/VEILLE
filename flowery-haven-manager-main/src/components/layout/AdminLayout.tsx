import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, FileText, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";

// Admin navigation items
const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard size={18} />,
  },
  {
    title: "Produits",
    href: "/admin/products",
    icon: <Package size={18} />,
  },
  {
    title: "Blog",
    href: "/admin/blog",
    icon: <FileText size={18} />,
  },
  {
    title: "Clients",
    href: "/admin/customers",
    icon: <Users size={18} />,
  },
  {
    title: "Commandes",
    href: "/admin/orders",
    icon: <ShoppingCart size={18} />,
  },
  {
    title: "Statistiques",
    href: "/admin/analytics",
    icon: <BarChart3 size={18} />,
  },
  {
    title: "Paramètres",
    href: "/admin/settings",
    icon: <Settings size={18} />,
  },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated AND is admin
    if (!authService.isAuthenticated()) {
      navigate("/auth/login");
      toast.error("Veuillez vous connecter pour accéder à l'administration");
      return;
    }
    
    if (!authService.isAdmin()) {
      navigate("/");
      toast.error("Vous n'avez pas les permissions nécessaires pour accéder à cette page");
      return;
    }
    
    // Get current user data
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUserData(currentUser);
    }
    
    setIsLoading(false);
  }, [navigate]);
  
  // Logout handler
  const handleLogout = () => {
    authService.logout();
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

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-64 flex-col bg-background border-r">
        <div className="px-3 py-4 flex flex-col h-full">
          {/* Logo & Admin title */}
          <div className="px-3 py-2">
            <Link to="/admin" className="flex items-center">
              <span className="font-serif text-xl">ChezFlora</span>
              <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[0.6rem] font-medium text-primary-foreground">
                ADMIN
              </span>
            </Link>
          </div>
          
          <div className="mt-8 flex-1">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                    location.pathname === item.href && "bg-muted font-medium"
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User info and logout */}
          <div className="mt-auto">
            <Separator className="my-4" />
            <div className="flex flex-col gap-4 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {userData?.firstName?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-sm font-medium">{userData?.firstName || 'Admin'} {userData?.lastName || ''}</p>
                  <p className="text-xs text-muted-foreground">{userData?.email || 'admin@admin.com'}</p>
                </div>
              </div>
              <div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="mr-2" />
                  Déconnexion
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start mt-1"
                  asChild
                >
                  <Link to="/">
                    <Package size={16} className="mr-2" />
                    Voir la boutique
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="pl-64 w-full">
        <div className="container max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;