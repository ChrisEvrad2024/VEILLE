// src/hooks/usePermissions.ts
import { userManagementService, PERMISSIONS } from '@/services/user-management.service';
import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { user, isAdmin } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    // Les super admins ont toutes les permissions
    if (user?.role === 'super_admin') return true;
    
    // Vérifier les permissions basées sur le rôle
    if (isAdmin) {
      // Pour simplifier, on peut supposer que les admins ont certaines permissions
      const adminPermissions = [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_UPDATE,
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.ORDER_UPDATE,
        // etc.
      ];
      
      return adminPermissions.includes(permission);
    }
    
    // Pour les utilisateurs normaux
    return false;
  };
  
  return {
    hasPermission,
    // Helpers pour des vérifications courantes
    canManageProducts: hasPermission(PERMISSIONS.PRODUCT_CREATE) && hasPermission(PERMISSIONS.PRODUCT_UPDATE),
    canManageOrders: hasPermission(PERMISSIONS.ORDER_UPDATE),
    canManageUsers: hasPermission(PERMISSIONS.USER_UPDATE),
  };
};