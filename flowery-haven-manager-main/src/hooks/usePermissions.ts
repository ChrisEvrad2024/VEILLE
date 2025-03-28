import { useState, useEffect } from "react";
import { authService } from "@/services/auth.service";
import { userManagementService, PERMISSIONS } from "@/services/user-management.service";

/**
 * Hook to check if the current user has specific permissions
 */
export const usePermissions = (requiredPermissions: string[] = []) => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      setIsLoading(true);
      
      // Check authentication status
      const authStatus = authService.isAuthenticated();
      setIsAuthenticated(authStatus);
      
      if (!authStatus) {
        setHasPermissions(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      // If no specific permissions required, user only needs to be authenticated
      if (requiredPermissions.length === 0) {
        setHasPermissions(true);
        setIsLoading(false);
        return;
      }
      
      // Check if user is admin (admins have all permissions)
      const adminStatus = authService.isAdmin();
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        setHasPermissions(true);
        setIsLoading(false);
        return;
      }
      
      // For regular users, check specific permissions
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          setHasPermissions(false);
          setIsLoading(false);
          return;
        }
        
        // In a real implementation, you would fetch the user's role permissions
        // For now, use a simplified approach based on user role
        const userRoles = await userManagementService.getAllRoles();
        const userRole = userRoles.find(role => role.name.toLowerCase() === user.role);
        
        if (!userRole) {
          setHasPermissions(false);
          setIsLoading(false);
          return;
        }
        
        // Check if user has all required permissions
        const hasAllPermissions = requiredPermissions.every(permission => 
          userRole.permissions.includes(permission)
        );
        
        setHasPermissions(hasAllPermissions);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setHasPermissions(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkPermissions();
  }, [requiredPermissions]);
  
  return {
    hasPermissions,
    isLoading,
    isAuthenticated,
    isAdmin,
    allPermissions: PERMISSIONS
  };
};

/**
 * Hook to check current user role
 */
export const useUserRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkRole = () => {
      setIsLoading(true);
      
      if (!authService.isAuthenticated()) {
        setRole(null);
        setIsLoading(false);
        return;
      }
      
      const user = authService.getCurrentUser();
      if (user) {
        setRole(user.role);
      } else {
        setRole(null);
      }
      
      setIsLoading(false);
    };
    
    checkRole();
    
    // Listen for auth state changes
    const handleStorageChange = () => {
      checkRole();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return { role, isLoading };
};