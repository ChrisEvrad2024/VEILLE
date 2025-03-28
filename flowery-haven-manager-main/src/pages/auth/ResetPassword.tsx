import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { authAdapter } from "@/services/adapters";

// Define form schema
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
      ),
    confirmPassword: z
      .string()
      .min(1, "La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// IMPORTANT: Removed 'async' from the component definition
const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    // Validate token (in a real app, you'd check this against the server)
    if (!token || token.length < 10) {
      setIsValidToken(false);
      toast.error("Token invalide", {
        description:
          "Le lien de réinitialisation n'est pas valide ou a expiré.",
      });
    }
  }, [token]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Form submission handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!token) {
      toast.error("Token manquant");
      return;
    }

    setIsLoading(true);

    try {
      // Call the reset password service
      await authAdapter.resetPassword(token, data.password);

      setIsSuccess(true);
      toast.success("Mot de passe réinitialisé", {
        description:
          "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      });

      // Redirect to login after a delay
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Échec de la réinitialisation", {
        description:
          error instanceof Error
            ? error.message
            : "Une erreur s'est produite. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <AuthLayout
        title="Lien invalide"
        description="Le lien de réinitialisation n'est pas valide ou a expiré."
        backLink={{
          href: "/auth/forgot-password",
          label: "Demander un nouveau lien",
        }}
      >
        <div className="text-center">
          <p className="mt-4 text-muted-foreground">
            Si vous avez perdu votre lien de réinitialisation, vous pouvez en
            demander un nouveau.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth/forgot-password">Demander un nouveau lien</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Réinitialiser le mot de passe"
      description="Créez un nouveau mot de passe pour votre compte."
      backLink={{ href: "/auth/login", label: "Retour à la connexion" }}
    >
      {isSuccess ? (
        <div className="space-y-6 pt-2 text-center">
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-medium">Mot de passe réinitialisé</h3>
            <p className="text-muted-foreground">
              Votre mot de passe a été réinitialisé avec succès. Vous allez être
              redirigé vers la page de connexion.
            </p>
          </div>

          <Button asChild className="mt-4">
            <Link to="/auth/login">Connexion</Link>
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Votre nouveau mot de passe"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Confirmer votre mot de passe"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Réinitialisation en cours..."
                : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
