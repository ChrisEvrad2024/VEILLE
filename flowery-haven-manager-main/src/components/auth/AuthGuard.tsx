import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { userManagementService } from "@/services/user-management.service";
import { toast } from "sonner";

interface AuthGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
  fallbackPath?: string;
}

/**
 * Component to guard routes based on authentication and permissions
 * 
 * @param children - The protected content
 * @param requiredPermissions - Array of permission strings required to access this route
 * @param fallbackPath - Path to redirect to if access is denied (defaults to /auth/login)
 */
const AuthGuard = ({ 
  children, 
  requiredPermissions = [], 
  fallbackPath = "/auth/login" 
}: AuthGuardProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuthorization = async () => {
      // First check if user is authenticated
      if (!authService.isAuthenticated()) {
        setIsAuthorized(false);
        return;
      }

      // If there are no specific permissions required, only authentication is needed
      if (requiredPermissions.length === 0) {
        setIsAuthorized(true);
        return;
      }

      // Check for admin role (admins always have access)
      if (authService.isAdmin()) {
        setIsAuthorized(true);
        return;
      }

      // For specific permissions, we need to check user role permissions
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          setIsAuthorized(false);
          return;
        }

        // In a real application, you would query the user's role permissions
        // For now, we'll use a simplified check where admins have all permissions
        if (user.role === 'admin' || user.role === 'super_admin') {
          setIsAuthorized(true);
          return;
        }

        // For specific permission checks, you would implement a more robust system
        // This is a placeholder implementation
        const userRoles = await userManagementService.getAllRoles();
        const userRole = userRoles.find(role => role.name.toLowerCase() === user.role);
        
        if (!userRole) {
          setIsAuthorized(false);
          return;
        }

        // Check if user has all required permissions
        const hasAllPermissions = requiredPermissions.every(permission => 
          userRole.permissions.includes(permission)
        );
        
        setIsAuthorized(hasAllPermissions);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();
  }, [requiredPermissions, location.pathname]);

  // Show nothing while checking permissions
  if (isAuthorized === null) {
    return null;
  }

  // Redirect if not authorized
  if (!isAuthorized) {
    // Only show toast if user is authenticated but lacks permissions
    if (authService.isAuthenticated() && requiredPermissions.length > 0) {
      toast.error("Accès refusé", {
        description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page"
      });
    } else if (!authService.isAuthenticated()) {
      toast.error("Authentification requise", {
        description: "Veuillez vous connecter pour accéder à cette page"
      });
    }

    return <Navigate to={fallbackPath} state={{ from: location.pathname }} replace />;
  }

  // Render children if authorized
  return <>{children}</>;
};

export default AuthGuard;