
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

// Define form schema
const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

const Login = async () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form submission handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      // Check for admin user (admin@admin.com with any password)
      // Using toLowerCase() to ensure case-insensitive comparison
      if (data.email.toLowerCase() === "admin@admin.com") {
        console.log("Admin login detected");
        
        // Set admin user in localStorage
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify({ 
          email: data.email,
          role: "admin",
          name: "Administrateur",
          createdAt: new Date().toISOString()
        }));
        
        toast.success("Connexion administrateur réussie", {
          description: "Bienvenue dans l'interface d'administration",
        });
        
        // Force navigation to admin dashboard with a slight delay to ensure localStorage is set
        setTimeout(() => {
          navigate("/admin");
        }, 200);
        
        return;
      }
      
      // For regular users (simulated login)
      console.log("Regular login attempt:", data.email);
      
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify({ 
        email: data.email,
        role: "customer",
        name: data.email.split('@')[0],
        createdAt: new Date().toISOString()
      }));
      
      toast.success("Connexion réussie", {
        description: "Bienvenue sur votre compte Floralie",
      });
      
      navigate(from === "/admin" ? "/" : from);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Échec de la connexion", {
        description: "Vérifiez vos identifiants et réessayez",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = async () => setShowPassword(!showPassword);

  return (
    <AuthLayout
      title="Connexion"
      description="Connectez-vous à votre compte pour accéder à vos commandes et favoris."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="votre@email.fr" 
                    type="email" 
                    autoComplete="email"
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Mot de passe</FormLabel>
                  <Link 
                    to="/auth/forgot-password" 
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="Votre mot de passe" 
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...field} 
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Vous n'avez pas de compte ?{" "}
          <Link to="/auth/register" className="text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-md">
        <p className="text-sm text-center font-medium">Accès administrateur</p>
        <p className="text-xs text-center text-muted-foreground mt-1">
          Utilisez admin@admin.com avec n'importe quel mot de passe pour accéder à l'interface d'administration.
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
