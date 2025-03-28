import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Laptop, Globe, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { loginHistoryService, LoginHistoryEntry } from "@/services/login-history.service";
import { toast } from "sonner";

const LoginHistory = () => {
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  // Load login history
  useEffect(() => {
    const loadLoginHistory = async () => {
      try {
        setIsLoading(true);
        const history = await loginHistoryService.getLoginHistory(20);
        setLoginHistory(history);
      } catch (error) {
        console.error("Error loading login history:", error);
        toast.error("Erreur lors du chargement de l'historique de connexion");
      } finally {
        setIsLoading(false);
      }
    };

    loadLoginHistory();
  }, []);

  // Handle clearing login history
  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      const success = await loginHistoryService.clearLoginHistory();
      if (success) {
        setLoginHistory([]);
        toast.success("Historique de connexion effacé");
      } else {
        toast.error("Erreur lors de l'effacement de l'historique");
      }
    } catch (error) {
      console.error("Error clearing login history:", error);
      toast.error("Erreur lors de l'effacement de l'historique");
    } finally {
      setIsClearing(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historique de connexion</h1>
        <p className="text-muted-foreground">
          Consultez les dernières connexions à votre compte.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Connexions récentes</CardTitle>
            <CardDescription>Les 20 dernières connexions à votre compte.</CardDescription>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isLoading || loginHistory.length === 0}>
                Effacer l'historique
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Effacer l'historique de connexion ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action effacera définitivement tout votre historique de connexion. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleClearHistory}
                  disabled={isClearing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isClearing ? "Effacement..." : "Effacer l'historique"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Chargement de l'historique...</p>
            </div>
          ) : loginHistory.length === 0 ? (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Aucun historique de connexion disponible.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Appareil</TableHead>
                    <TableHead>Localisation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.success ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Succès
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Échec
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(entry.timestamp)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-muted-foreground" />
                          <span>{entry.device || "Inconnu"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{entry.location || "Inconnu"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sécurité du compte</CardTitle>
          <CardDescription>
            Conseils pour protéger votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/40">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                Détection d'activité suspecte
              </h3>
              <p className="text-sm text-muted-foreground">
                Nous vous informerons si nous détectons des connexions inhabituelles à votre compte. 
                Vérifiez régulièrement cette page pour vous assurer que toutes les connexions sont bien de vous.
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border">
                <h3 className="font-medium mb-2">Mot de passe fort</h3>
                <p className="text-sm text-muted-foreground">
                  Utilisez un mot de passe unique et complexe pour votre compte. Nous vous recommandons 
                  de le changer régulièrement.
                </p>
              </div>
              
              <div className="p-4 rounded-lg border">
                <h3 className="font-medium mb-2">Appareils de confiance</h3>
                <p className="text-sm text-muted-foreground">
                  Déconnectez-vous toujours lorsque vous utilisez un appareil public ou partagé.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginHistory;