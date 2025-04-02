import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authAdapter } from "@/services/adapters";
import { toast } from "sonner";

const RequireAuth = () => {
  const location = useLocation();
  const isAuthenticated = authAdapter.isAuthenticated();

  useEffect(() => {
    // Store the path for redirection after login
    if (!isAuthenticated) {
      authAdapter.storeRedirectPath(location.pathname);
      
      toast.error("Authentification requise", {
        description: "Veuillez vous connecter pour accéder à cette page.",
        duration: 3000
      });
    }
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated) {
    // Redirect to login page with return path
    return <Navigate to="/auth/login" replace />;
  }

  // User is authenticated, render the protected route
  return <Outlet />;
};

export default RequireAuth;