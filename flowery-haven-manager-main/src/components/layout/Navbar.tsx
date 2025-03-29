import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Heart,
  LogOut,
  Settings,
  ShoppingCart,
  UserCircle,
  LayoutDashboard,
  ChevronDown,
  Bell,
  Store,
  BarChart4,
  Package,
  CreditCard,
  Clock,
  MapPin,
  FileText,
} from "lucide-react";
import { getCartItemCount } from "@/lib/cart";
import LanguageSelector from "@/components/shared/LanguageSelector";
import { authService } from "@/services/auth.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [hasNotifications, setHasNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    // Update cart count on mount and when localStorage changes
    const updateCartCount = () => {
      setCartCount(getCartItemCount());
    };

    // Check authentication status
    const checkAuth = () => {
      const isAuthStatus = authService.isAuthenticated();
      setIsAuthenticated(isAuthStatus);

      if (isAuthStatus) {
        const user = authService.getCurrentUser();
        setUserData(user);
        setIsAdmin(authService.isAdmin());

        // Simulate a notification for demo purposes
        setHasNotifications(true);
      } else {
        setUserData(null);
        setIsAdmin(false);
        setHasNotifications(false);
      }
    };

    updateCartCount();
    checkAuth();

    // Listen for storage events to update cart count when it changes in another tab
    window.addEventListener("storage", () => {
      updateCartCount();
      checkAuth();
    });

    // Custom event for cart updates within the same tab
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    toast.success("Déconnexion réussie");
    navigate("/");
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserData(null);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData) return "?";

    if (userData.firstName && userData.lastName) {
      return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`;
    } else if (userData.firstName) {
      return userData.firstName.charAt(0);
    } else if (userData.email) {
      return userData.email.charAt(0).toUpperCase();
    }

    return "U";
  };

  // Get gradient based on user role
  const getAvatarGradient = () => {
    if (isAdmin) {
      return "bg-gradient-to-br from-amber-500 to-orange-600";
    }
    return "bg-gradient-to-br from-blue-500 to-indigo-600";
  };

  // Check if link is active
  const isLinkActive = (path: string) => {
    if (path === "/") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-sm",
        isScrolled
          ? "py-2 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 shadow-sm"
          : "py-4 bg-white/50 dark:bg-gray-950/50"
      )}
    >
      <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-serif text-2xl font-medium tracking-tight text-primary"
        >
          ChezFlora
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {[
            { path: "/", label: "Accueil" },
            { path: "/catalog", label: "Boutique" },
            { path: "/quote-request", label: "Demande de devis" }, // Ajout du lien vers les devis
            { path: "/wishlist", label: "Wishlist" },
            { path: "/blog", label: "Blog" },
            { path: "/about", label: "À Propos" },
            { path: "/contact", label: "Contact" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-sm font-medium transition-colors relative py-1",
                isLinkActive(item.path)
                  ? "text-primary"
                  : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
              )}
            >
              {item.label}
              {isLinkActive(item.path) && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Icons */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <LanguageSelector />

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
          >
            <Search size={20} />
          </Button>

          <Link
            to="/wishlist"
            className="relative p-2 rounded-full transition-colors text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
          >
            <Heart size={20} />
          </Link>

          <Link
            to="/cart"
            className="relative p-2 rounded-full transition-colors text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 font-medium">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-1">
              {/* Notifications */}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full"
                >
                  <Bell size={20} />
                  {hasNotifications && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>
                  )}
                </Button>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 h-auto rounded-full relative focus-visible:ring-offset-0 focus-visible:ring-primary/20"
                  >
                    <Avatar
                      className={cn(
                        "h-8 w-8 border-2 border-white shadow-sm transition-transform",
                        isAdmin ? "border-amber-300" : "border-primary/20"
                      )}
                    >
                      <AvatarFallback className={getAvatarGradient()}>
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>

                    <span className="text-sm font-medium sr-only sm:not-sr-only line-clamp-1">
                      {userData?.firstName || "Compte"}
                    </span>
                    <ChevronDown
                      size={16}
                      className="text-gray-500 dark:text-gray-400"
                    />

                    {hasNotifications && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="font-semibold">
                        {userData?.firstName} {userData?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {userData?.email}
                      </p>
                      {isAdmin && (
                        <Badge
                          variant="outline"
                          className="w-fit mt-1 border-amber-300 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                        >
                          Administrateur
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4 text-indigo-500" />
                        <span>Mon compte</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/account/orders" className="cursor-pointer">
                        <ShoppingCart className="mr-2 h-4 w-4 text-green-600" />
                        <span>Mes commandes</span>
                        {hasNotifications && (
                          <Badge
                            variant="outline"
                            className="ml-auto h-5 px-1.5 border-red-200 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                          >
                            1
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/account/addresses" className="cursor-pointer">
                        <MapPin className="mr-2 h-4 w-4 text-blue-600" />
                        <span>Mes adresses</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/account/quotes" className="cursor-pointer">
                        <MapPin className="mr-2 h-4 w-4 text-purple-600" />
                        <span>Mes devis</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/account/profile" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4 text-gray-600" />
                        <span>Paramètres</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Administration
                      </DropdownMenuLabel>

                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4 text-amber-600" />
                            <span>Tableau de bord</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link to="/admin/orders" className="cursor-pointer">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            <span>Commandes</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link to="/admin/quotes" className="cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Devis</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Store className="mr-2 h-4 w-4 text-purple-600" />
                            <span>Gestion boutique</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem asChild>
                                <Link to="/admin/products">
                                  <Package className="mr-2 h-4 w-4" />
                                  <span>Produits</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to="/admin/orders">
                                  <ShoppingCart className="mr-2 h-4 w-4" />
                                  <span>Commandes</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to="/admin/customers">
                                  <UserCircle className="mr-2 h-4 w-4" />
                                  <span>Clients</span>
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuItem asChild>
                          <Link to="/admin/blog" className="cursor-pointer">
                            <CreditCard className="mr-2 h-4 w-4 text-cyan-600" />
                            <span>Blog & Contenu</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link
                            to="/admin/analytics"
                            className="cursor-pointer"
                          >
                            <BarChart4 className="mr-2 h-4 w-4 text-emerald-600" />
                            <span>Statistiques</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-full border-primary/20 hover:border-primary/80 hover:bg-primary/5 dark:border-primary/30 dark:hover:bg-primary/10"
              asChild
            >
              <Link to="/auth/login">
                <UserCircle size={18} />
                <span className="font-medium">Connexion</span>
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm pt-20 px-6 overflow-y-auto">
          <div className="flex flex-col space-y-5">
            {/* Profile Section if authenticated */}
            {isAuthenticated && (
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50">
                <Avatar
                  className={cn(
                    "h-12 w-12 border-2 border-white shadow-md",
                    isAdmin ? "border-amber-300" : "border-primary/20"
                  )}
                >
                  <AvatarFallback className={getAvatarGradient()}>
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="font-semibold">
                    {userData?.firstName} {userData?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userData?.email}
                  </p>
                  {isAdmin && (
                    <Badge
                      variant="outline"
                      className="mt-1 border-amber-300 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                    >
                      Administrateur
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Main Navigation Links */}
            <nav className="flex flex-col space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider pl-2">
                Navigation
              </p>

              {[
                { path: "/", label: "Accueil", icon: <Store size={20} /> },
                {
                  path: "/catalog",
                  label: "Boutique",
                  icon: <Package size={20} />,
                },
                {
                  path: "/wishlist",
                  label: "Wishlist",
                  icon: <Heart size={20} />,
                },
                {
                  path: "/blog",
                  label: "Blog",
                  icon: <CreditCard size={20} />,
                },
                { path: "/about", label: "À Propos", icon: <Bell size={20} /> },
                {
                  path: "/contact",
                  label: "Contact",
                  icon: <Clock size={20} />,
                },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-lg transition-colors",
                    isLinkActive(item.path)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Account Links */}
            {isAuthenticated && (
              <nav className="flex flex-col space-y-3 pt-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider pl-2">
                  Mon compte
                </p>

                <Link
                  to="/account"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserCircle size={20} className="text-indigo-500" />
                  Mon profil
                </Link>

                <Link
                  to="/account/orders"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingCart size={20} className="text-green-600" />
                  Mes commandes
                  {hasNotifications && (
                    <Badge
                      variant="outline"
                      className="ml-auto h-5 px-1.5 border-red-200 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                    >
                      1
                    </Badge>
                  )}
                </Link>

                <Link
                  to="/account/addresses"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MapPin size={20} className="text-blue-600" />
                  Mes adresses
                </Link>

                <Link
                  to="/account/profile"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings size={20} className="text-gray-600" />
                  Paramètres
                </Link>
              </nav>
            )}

            {/* Admin Panel Links */}
            {isAdmin && (
              <nav className="flex flex-col space-y-3 pt-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider pl-2">
                  Administration
                </p>

                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={20} className="text-amber-600" />
                  Tableau de bord
                </Link>

                <Link
                  to="/admin/products"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Package size={20} className="text-purple-600" />
                  Produits
                </Link>

                <Link
                  to="/admin/customers"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserCircle size={20} className="text-emerald-600" />
                  Clients
                </Link>

                <Link
                  to="/admin/blog"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <CreditCard size={20} className="text-cyan-600" />
                  Blog & Contenu
                </Link>
              </nav>
            )}

            {/* Auth Actions */}
            <div className="pt-4 mt-auto">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={18} />
                  Déconnexion
                </Button>
              ) : (
                <Button
                  className="w-full gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  asChild
                >
                  <Link to="/auth/login">
                    <UserCircle size={18} />
                    Connexion / Inscription
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
