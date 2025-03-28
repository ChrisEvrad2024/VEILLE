// src/pages/admin/Dashboard.tsx
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-serif mb-6">Tableau de bord administrateur</h1>
      
      <div className="bg-white rounded-md shadow p-6">
        <h2 className="text-xl font-medium mb-4">Bienvenue, {user?.firstName || 'Administrateur'}</h2>
        <p className="text-muted-foreground">
          Vous êtes connecté en tant qu'administrateur. Utilisez le menu pour accéder aux différentes fonctionnalités.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;