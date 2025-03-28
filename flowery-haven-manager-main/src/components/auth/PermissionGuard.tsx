import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGuardProps {
  children: ReactNode;
  permissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions, otherwise ANY will suffice
  fallback?: ReactNode; // Optional fallback component to show if not permitted
}

/**
 * Component to conditionally render children based on user permissions
 * 
 * @example
 * // Hide content if user doesn't have the permission
 * <PermissionGuard permissions={[PERMISSIONS.PRODUCT_CREATE]}>
 *   <Button>Add Product</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Show alternative content if user doesn't have permission
 * <PermissionGuard 
 *   permissions={[PERMISSIONS.PRODUCT_CREATE]} 
 *   fallback={<Button disabled>Add Product (Requires Permission)</Button>}
 * >
 *   <Button>Add Product</Button>
 * </PermissionGuard>
 */
const PermissionGuard = ({ 
  children, 
  permissions = [], 
  requireAll = true,
  fallback = null 
}: PermissionGuardProps) => {
  const { isAdmin, isAuthenticated, hasPermissions, isLoading } = usePermissions(permissions);

  // Admin users always have access to everything
  if (isAdmin) {
    return <>{children}</>;
  }

  // If no special permissions required, just check auth
  if (permissions.length === 0) {
    return isAuthenticated ? <>{children}</> : <>{fallback}</>;
  }

  // Handle loading state - we could show nothing or a placeholder
  if (isLoading) {
    return null;
  }

  // Check permissions
  return hasPermissions ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;