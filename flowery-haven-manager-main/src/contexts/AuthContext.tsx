// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/services/auth.service";
import { User } from "@/services/auth.service";
import { toast } from "sonner";

interface AuthContextType {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updates: any) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour nettoyer les erreurs
  const clearError = () => setError(null);

  useEffect(() => {
    // Vérifier l'authentification au chargement
    const checkAuth = () => {
      try {
        const isAuth = authService.isAuthenticated();
        if (isAuth) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : "Une erreur s'est produite lors de la vérification de l'authentification";
        setError(errorMessage);
        
        // En cas d'erreur d'authentification, nettoyer l'état pour éviter des problèmes
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    clearError();
    
    try {
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Échec de la connexion. Veuillez vérifier vos identifiants.";
      
      setError(errorMessage);
      
      // Afficher un toast d'erreur pour informer l'utilisateur
      toast.error("Erreur de connexion", {
        description: errorMessage,
      });
      
      throw err; // Propager l'erreur pour que les composants puissent la gérer
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    clearError();
    
    try {
      const newUser = await authService.register(userData);
      setUser(newUser);
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Échec de l'inscription. Veuillez réessayer.";
      
      setError(errorMessage);
      
      toast.error("Erreur d'inscription", {
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      authService.logout();
      setUser(null);
      clearError();
    } catch (err) {
      console.error("Logout error:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Une erreur s'est produite lors de la déconnexion";
      
      setError(errorMessage);
      
      toast.error("Erreur de déconnexion", {
        description: errorMessage,
      });
    }
  };

  const updateUserProfile = async (updates: any) => {
    setIsLoading(true);
    clearError();
    
    try {
      const updatedUser = await authService.updateUserProfile(updates);
      setUser(updatedUser);
    } catch (err) {
      console.error("Profile update error:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Échec de la mise à jour du profil. Veuillez réessayer.";
      
      setError(errorMessage);
      
      toast.error("Erreur de mise à jour", {
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: !!user && authService.isAdmin(),
        error,
        login,
        register,
        logout,
        updateUserProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};