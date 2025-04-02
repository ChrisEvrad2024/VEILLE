import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Tags,
  FileText,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Calendar,
  BarChart2,
  Menu,
  X,
  LogOut,
  Home,
  Layout,
  FileType,
  PanelLeft,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Type de menu
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: MenuItem[];
  expanded?: boolean;
}

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      label: "Tableau de bord",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/admin",
    },
    {
      label: "Catalogue",
      icon: <ShoppingBag className="h-5 w-5" />,
      path: "#",
      expanded: true,
      children: [
        {
          label: "Produits",
          icon: <ShoppingBag className="h-4 w-4" />,
          path: "/admin/products",
        },
        {
          label: "Catégories",
          icon: <Tags className="h-4 w-4" />,
          path: "/admin/categories",
        },
      ],
    },
    {
      label: "Commandes",
      icon: <ShoppingBag className="h-5 w-5" />,
      path: "/admin/orders",
    },
    {
      label: "Devis",
      icon: <FileText className="h-5 w-5" />,
      path: "/admin/quotes",
    },
    {
      label: "Blog",
      icon: <FileText className="h-5 w-5" />,
      path: "/admin/blog",
      expanded: false,
      children: [
        {
          label: "Articles",
          icon: <FileText className="h-4 w-4" />,
          path: "/admin/blog"
        },
        {
          label: "Commentaires",
          icon: <MessageSquare className="h-4 w-4" />,
          path: "/admin/blog/comments"
        },
        {
          label: "Planification",
          icon: <Calendar className="h-4 w-4" />,
          path: "/admin/blog/scheduler"
        },
        {
          label: "Statistiques",
          icon: <BarChart2 className="h-4 w-4" />,
          path: "/admin/blog/statistics"
        }
      ]
    },
    {
      label: "Gestion de contenu",
      icon: <Layout className="h-5 w-5" />,
      path: "/admin/cms",
      expanded: false,
      children: [
        {
          label: "Pages",
          icon: <FileText className="h-4 w-4" />,
          path: "/admin/cms"
        },
        {
          label: "Composants",
          icon: <FileType className="h-4 w-4" />,
          path: "/admin/cms/components"
        },
        {
          label: "Pages spéciales",
          icon: <AlertTriangle className="h-4 w-4" />,
          path: "/admin/cms/special"
        },
        {
          label: "Modèles",
          icon: <PanelLeft className="h-4 w-4" />,
          path: "/admin/cms/templates"
        }
      ]
    },
    {
      label: "Clients",
      icon: <Users className="h-5 w-5" />,
      path: "/admin/customers",
    },
    {
      label: "Paramètres",
      icon: <Settings className="h-5 w-5" />,
      path: "/admin/settings",
    },
  ]);

  // Determine active menu based on current path
  useEffect(() => {
    const currentPath = location.pathname;

    // Find the main menu item that contains the current path
    const mainMenuItem = menuItems.find(
      (item) =>
        item.path === currentPath ||
        (item.children &&
          item.children.some((child) => child.path === currentPath))
    );

    if (mainMenuItem) {
      setActiveMenu(mainMenuItem.label);

      // If this menu has children, ensure it's expanded
      if (mainMenuItem.children) {
        setMenuItems((prevItems) =>
          prevItems.map((item) =>
            item.label === mainMenuItem.label
              ? { ...item, expanded: true }
              : item
          )
        );
      }
    }
  }, [location.pathname]);

  // Toggle menu expansion
  const toggleSubmenu = (menuLabel: string) => {
    setMenuItems((prevItems) =>
      prevItems.map((item) =>
        item.label === menuLabel ? { ...item, expanded: !item.expanded } : item
      )
    );
  };

  // Handle logout
  const handleLogout = () => {
    // In a real app, this would clear authentication state
    navigate("/auth/login");
  };

  // Render menu item with possible children
  const renderMenuItem = (item: MenuItem) => {
    const isActive = location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const showChildren = hasChildren && item.expanded;

    return (
      <div key={item.label} className="space-y-1">
        {hasChildren ? (
          <>
            <button
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMenu === item.label
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => toggleSubmenu(item.label)}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {showChildren && (
              <div className="pl-8 space-y-1">
                {item.children?.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                      ${
                        isActive
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {child.icon}
                    <span>{child.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </>
        ) : (
          <NavLink
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-card">
        <div className="p-4 border-b bg-card">
          <div className="flex items-center">
            <span className="text-xl font-bold">Chez FLORA Panel</span>
          </div>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="px-2 space-y-2">{menuItems.map(renderMenuItem)}</nav>
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@admin.com</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Voir le site</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account/profile")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-4 border-b bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">Admin Panel</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 py-4 h-[calc(100vh-136px)]">
            <nav className="px-2 space-y-2">
              {menuItems.map(renderMenuItem)}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t mt-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">
                    admin@admin.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Top Navigation */}
        <header className="sticky top-0 z-10 bg-background border-b py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h1 className="text-lg font-medium">{activeMenu}</h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="hidden sm:flex items-center gap-1"
              >
                <Home className="h-4 w-4 mr-1" />
                Voir le site
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;