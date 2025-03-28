// src/pages/admin/UserManagement.tsx
import { useState, useEffect } from "react";
import { userManagementService } from '@/services/user-management.service';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import PermissionGate from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/services/user-management.service";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = usePermissions();
  
  useEffect(() => {
    const fetchData =  () => {
      setIsLoading(true);
      try {
        const [usersData, rolesData] = await Promise.all([
          userManagementService.getAllUsers(),
          userManagementService.getAllRoles()
        ]);
        
        setUsers(usersData);
        setRoles(rolesData);
      } catch (error) {
        console.error("Error fetching users and roles:", error);
        toast.error("Échec du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleRoleChange = async (userId, newRole) => {
    try {
      // Vérifier les permissions
      if (!hasPermission(PERMISSIONS.USER_UPDATE)) {
        toast.error("Vous n'avez pas les permissions nécessaires");
        return;
      }
      
      await userManagementService.updateUser(userId, { role: newRole });
      
      // Mettre à jour la liste des utilisateurs
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success("Rôle mis à jour avec succès");
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Échec de la mise à jour du rôle");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif">Gestion des utilisateurs</h1>
        <PermissionGate permission={PERMISSIONS.USER_CREATE}>
          <Button>Ajouter un utilisateur</Button>
        </PermissionGate>
      </div>
      
      <div className="bg-white rounded-md shadow">
        <div className="p-4 border-b">
          <Input placeholder="Rechercher un utilisateur..." />
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <PermissionGate 
                    permission={PERMISSIONS.ROLE_MANAGE}
                    fallback={<Badge>{user.role}</Badge>}
                  >
                    <Select
                      value={user.role}
                      onValueChange={value => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.name.toLowerCase()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PermissionGate>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <PermissionGate permission={PERMISSIONS.USER_UPDATE}>
                      <Button variant="outline" size="sm">Modifier</Button>
                    </PermissionGate>
                    <PermissionGate permission={PERMISSIONS.USER_DELETE}>
                      <Button variant="destructive" size="sm">Supprimer</Button>
                    </PermissionGate>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;