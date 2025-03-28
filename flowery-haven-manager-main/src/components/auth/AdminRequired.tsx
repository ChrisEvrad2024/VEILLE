import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Shield, ShieldAlert, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminRequiredProps {
  children: ReactNode;
  fallbackContent?: ReactNode;
}

/**
 * Component to restrict content to admin users only
 * Shows a friendly access denied message instead of immediate redirect
 */
const AdminRequired = ({ children, fallbackContent }: AdminRequiredProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = () => {
      const authStatus = authService.isAuthenticated();
      setIsAuthenticated(authStatus);
      
      if (authStatus) {
        const adminStatus = authService.isAdmin();
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          toast.error("Accès réservé aux administrateurs", {
            description: "Vous n'avez pas les permissions nécessaires pour accéder à cette section"
          });
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, []);

  // Loading state
  if (isAdmin === null || isAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="animate-pulse flex flex-col items-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">Vérification des permissions...</h2>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Lock className="h-12 w-12 text-primary/70 mb-4" />
        <h2 className="text-2xl font-medium mb-2">Authentification requise</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Vous devez être connecté pour accéder à cette page.
        </p>
        <Button onClick={() => navigate("/auth/login")}>
          Se connecter
        </Button>
      </div>
    );
  }

  // Authenticated but not admin
  if (!isAdmin) {
    // Use custom fallback content if provided
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }
    
    // Default access denied UI
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive/70 mb-4" />
        <h2 className="text-2xl font-medium mb-2">Accès réservé</h2>
        <p className="text-muted-foreground mb-2 max-w-md">
          Cette section est réservée aux administrateurs du site.
        </p>
        <p className="text-muted-foreground mb-6 max-w-md">
          Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            Retour à l'accueil
          </Button>
          <Button variant="default" onClick={() => navigate("/account")}>
            Mon compte
          </Button>
        </div>
      </div>
    );
  }

  // User is admin, render children
  return <>{children}</>;
};

export default AdminRequired;