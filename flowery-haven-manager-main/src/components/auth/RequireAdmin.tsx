import { Navigate, Outlet } from "react-router-dom";
import { authAdapter } from "@/services/adapters";
import { toast } from "sonner";
import { useEffect } from "react";

const RequireAdmin = () => {
  const isAuthenticated = authAdapter.isAuthenticated();
  const isAdmin = authAdapter.isAdmin();

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      toast.error("Accès refusé", {
        description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page."
      });
    }
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/auth/login" replace />;
  }

  if (!isAdmin) {
    // Redirect to home page if authenticated but not admin
    return <Navigate to="/" replace />;
  }

  // User is admin, render the protected admin route
  return <Outlet />;
};

export default RequireAdmin;