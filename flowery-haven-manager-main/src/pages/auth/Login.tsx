import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { authAdapter } from "@/services/adapters";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define form schema
const formSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

// Custom AuthLayout with logo
const AuthLayoutWithLogo = ({ title, description, children }) => {
  return (
    <div className="flex min-h-screen">
      {/* Logo Side */}
      <div className="hidden md:flex md:w-1/2 bg-gray-50 items-center justify-center p-8">
        <div className="max-w-md">
          <img
            src="/assets/logo_nobg.png"
            alt="CHEZFLORA"
            className="w-full max-w-xs mx-auto"
          />
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          </div>

          {/* On mobile only, show a smaller logo */}
          <div className="md:hidden flex justify-center mb-8">
            <img src="/assets/logo_nobg.png" alt="CHEZFLORA" className="w-40" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have a stored path, otherwise use location state or default to home
  const getRedirectPath = () => {
    // First priority: path stored in localStorage (from RequireAuth)
    const storedPath = localStorage.getItem("authRedirectPath");
    
    // Second priority: from location state (React Router)
    if (location.state?.from) return location.state.from;

    // Return stored path or default fallback
    return storedPath || "/";
  };

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Reset error when form values change
  useEffect(() => {
    if (loginError) {
      const subscription = form.watch(() => {
        setLoginError("");
      });
      return () => subscription.unsubscribe();
    }
  }, [form, loginError]);

  // Form submission handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setLoginError("");

    try {
      // Use auth adapter to login
      await authAdapter.login(data.email, data.password);

      // Check if user is admin to determine redirect
      const isAdmin = authAdapter.isAdmin();
      const redirectTo = isAdmin ? "/admin" : getRedirectPath();

      toast.success("Connexion réussie", {
        description: isAdmin
          ? "Bienvenue dans l'interface d'administration"
          : "Bienvenue sur votre compte Chez Flora",
      });

      // Redirect to admin dashboard or previous page
      navigate(redirectTo);
    } catch (error) {
      console.error("Login error:", error);

      // Set error message for display - utiliser directement le message d'erreur
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Vérifiez vos identifiants et réessayez";

      setLoginError(errorMessage);

      // Affichage du toast d'erreur avec le message précis
      toast.error("Échec de la connexion", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <AuthLayoutWithLogo
      title="Connexion"
      description="Connectez-vous à votre compte pour accéder à vos commandes et favoris."
    >
      {/* Button to return to site */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex items-center text-muted-foreground hover:text-primary"
        >
          <Link to="/">
            <ArrowLeft size={16} className="mr-2" />
            Revenir sur le site
          </Link>
        </Button>
      </div>

      {/* Error message */}
      {loginError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}

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

          <Button type="submit" className="w-full" disabled={isLoading}>
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
        <p className="text-sm text-center font-medium">CHEZ_FLORA</p>
        <p className="text-xs text-center text-muted-foreground mt-1">
          Prenez plaisir à vous connecter à CHEZFLORA
        </p>
      </div>
    </AuthLayoutWithLogo>
  );
};

export default Login;