import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { initialize } from "@/services";

// Import Auth Components
import RequireAuth from "@/components/auth/RequireAuth";
import RequireAdmin from "@/components/auth/RequireAdmin";

// Import Pages - Authentification Module
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Import baseline pages that might be necessary
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import About from "./pages/About";

// We'll keep these imports for the authentication module
import MyAccount from "./pages/account/MyAccount";
import AccountLayout from "./components/layout/AccountLayout";
import ProfileSettings from "./pages/account/ProfileSettings";
import OrderHistory from "./pages/account/OrderHistory";
import Addresses from "./pages/account/Addresses";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LoginHistory from "./pages/account/LoginHistory";

// Import Admin Product and Category Management
import ProductsManagement from "./pages/admin/ProductsManagement";
import CategoriesManagement from "./pages/admin/CategoriesManagement";

const queryClient = new QueryClient();

const App = () => {
  // Initialize database and services
  useEffect(() => {
    initialize().catch(error => {
      console.error("Failed to initialize services:", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          
          {/* Basic store routes - keep minimal for testing */}
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          
          {/* Auth Routes - Our current focus */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Account Routes */}
          <Route element={<RequireAuth />}>
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<MyAccount />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="orders" element={<OrderHistory />} />
              <Route path="login-history" element={<LoginHistory />} />
              <Route path="addresses" element={<Addresses />} />
            </Route>
          </Route>
          
          {/* Admin Routes */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              {/* Admin Product and Category Management */}
              <Route path="products" element={<ProductsManagement />} />
              <Route path="categories" element={<CategoriesManagement />} />
            </Route>
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;