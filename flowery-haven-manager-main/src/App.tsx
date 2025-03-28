
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import MyAccount from "./pages/account/MyAccount";
import AccountLayout from "./components/layout/AccountLayout";
import ProfileSettings from "./pages/account/ProfileSettings";
import OrderHistory from "./pages/account/OrderHistory";
import Addresses from "./pages/account/Addresses";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductsManagement from "./pages/admin/ProductsManagement";
import BlogManagement from "./pages/admin/BlogManagement";
import CustomersManagement from "./pages/admin/CustomersManagement";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import About from "./pages/About";

const queryClient = new QueryClient();

const App = async () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          
          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          
          {/* Account Routes */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<MyAccount />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="orders" element={<OrderHistory />} />
            <Route path="addresses" element={<Addresses />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="blog" element={<BlogManagement />} />
            <Route path="customers" element={<CustomersManagement />} />
            {/* These routes will be implemented later */}
            <Route path="orders" element={<div className="p-4">Gestion des commandes (à implémenter)</div>} />
            <Route path="analytics" element={<div className="p-4">Statistiques (à implémenter)</div>} />
            <Route path="settings" element={<div className="p-4">Paramètres (à implémenter)</div>} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
