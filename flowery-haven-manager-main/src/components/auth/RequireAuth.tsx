import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authAdapter } from "@/services/adapters";
import { toast } from "sonner";
import { useEffect } from "react";

const RequireAuth = () => {
  const location = useLocation();
  const isAuthenticated = authAdapter.isAuthenticated();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Authentification requise", {
        description: "Veuillez vous connecter pour accéder à cette page."
      });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    // Redirect to login page with return path
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render the protected route
  return <Outlet />;
};

export default RequireAuth;