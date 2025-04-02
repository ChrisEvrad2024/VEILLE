import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { initialize } from "@/services";

// Import Providers
import { ProductProvider } from "@/contexts/ProductContext";

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
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import About from "./pages/About";

// Import CMSPage for dynamic content
import CMSPage from "./pages/CMSPage";

// Admin Blog Pages
import BlogDashboard from "./pages/admin/blog/BlogDashboard";
import CommentModeration from "./pages/admin/blog/CommentModeration";
import BlogScheduler from "./pages/admin/blog/BlogScheduler";
import BlogStatistics from "./pages/admin/blog/BlogStatistics";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";

// Admin Media Pages
import AdminMediaUpload from "./pages/admin/media/MediaUpload";

// Account Pages
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

// Import Cart, Order and Quote Management
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderDetail from "./pages/account/OrderDetail";
import QuoteRequest from "./pages/QuoteRequest";
import QuoteHistory from "./pages/account/QuoteHistory";
import QuoteDetail from "./pages/account/QuoteDetail";

// Import CMS
import CMSLayout from "./components/layout/CMSLayout";
import CMSDashboard from "./pages/admin/cms/CMSDashboard";
import PageEditor from "./pages/admin/cms/PageEditor";
import ComponentManager from "./pages/admin/cms/ComponentManager";
import SpecialPages from "./pages/admin/cms/SpecialPages";
import TemplateManager from "./pages/admin/cms/TemplateManager";

// Import Admin Order Management
import OrdersManagement from "./pages/admin/OrdersManagement";
import AdminQuoteDetail from "./pages/admin/AdminQuoteDetail";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import QuotesManagement from "./pages/admin/QuotesManagement";

const queryClient = new QueryClient();

const App = () => {
  // Initialize database and services
  useEffect(() => {
    initialize().catch((error) => {
      console.error("Failed to initialize services:", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ProductProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />

            {/* Basic store routes */}
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />

            {/* Blog Routes */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPostDetail />} />
            {/* <Route path="/blog/category/:category" element={<BlogCategory />} />
            <Route path="/blog/tag/:tag" element={<BlogTag />} /> */}

            {/* Cart, Checkout and Quote Request Routes */}
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/order-confirmation/:orderId"
              element={<OrderConfirmation />}
            />
            <Route path="/quote-request" element={<QuoteRequest />} />

            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/auth/reset-password/:token"
              element={<ResetPassword />}
            />

            {/* Protected Account Routes */}
            <Route element={<RequireAuth />}>
              <Route path="/account" element={<AccountLayout />}>
                <Route index element={<MyAccount />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="orders" element={<OrderHistory />} />
                <Route path="orders/:orderId" element={<OrderDetail />} />
                <Route path="quotes" element={<QuoteHistory />} />
                <Route path="quotes/:quoteId" element={<QuoteDetail />} />
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

                {/* Admin Blog Management */}
                <Route path="blog" element={<BlogDashboard />} />
                <Route path="blog/comments" element={<CommentModeration />} />
                <Route path="blog/scheduler" element={<BlogScheduler />} />
                <Route path="blog/statistics" element={<BlogStatistics />} />

                {/* Admin CMS Management */}
                <Route path="cms" element={<CMSLayout />}>
                  <Route index element={<CMSDashboard />} />
                  <Route path="new" element={<PageEditor />} />
                  <Route path=":id/edit" element={<PageEditor />} />
                  <Route path="components" element={<ComponentManager />} />
                  <Route path="special" element={<SpecialPages />} />
                  <Route path="templates" element={<TemplateManager />} />
                </Route>

                {/* Admin Media Management */}
                {/* <Route path="media" element={<AdminMedia />} /> */}
                <Route path="media/upload" element={<AdminMediaUpload />} />

                {/* Admin Order Management */}
                <Route path="orders" element={<OrdersManagement />} />
                <Route path="orders/:orderId" element={<AdminOrderDetail />} />

                {/* Admin Quote Management */}
                <Route path="quotes" element={<QuotesManagement />} />
                <Route path="quotes/:quoteId" element={<AdminQuoteDetail />} />
              </Route>
            </Route>

            {/* Dynamic CMS Pages (must be after all explicit routes to avoid conflicts) */}
            <Route path="/:slug" element={<CMSPage />} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </ProductProvider>
    </QueryClientProvider>
  );
};

export default App;