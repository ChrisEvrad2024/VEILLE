// src/services/user-management.service.ts
import { dbService } from './db.service';
import { authService, User } from './auth.service';

// Types supplémentaires pour la gestion des utilisateurs
export interface AdminAction {
    id: string;
    adminId: string;
    adminName: string;
    targetUserId?: string;
    targetUserEmail?: string;
    action: 'create_user' | 'update_user' | 'delete_user' | 'suspend_user' | 'activate_user' | 
            'change_role' | 'login' | 'logout' | 'create_product' | 'update_product' | 
            'delete_product' | 'update_order' | 'moderate_review' | 'edit_content' | 
            'system_setting' | 'other';
    details: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}

export interface UserRole {
    id: string;
    name: string;
    permissions: string[];
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Permission {
    id: string;
    name: string;
    category: string;
    description: string;
}

// Liste des permissions disponibles
export const PERMISSIONS = {
    // Produits
    PRODUCT_VIEW: 'product_view',
    PRODUCT_CREATE: 'product_create',
    PRODUCT_UPDATE: 'product_update',
    PRODUCT_DELETE: 'product_delete',
    
    // Commandes
    ORDER_VIEW: 'order_view',
    ORDER_UPDATE: 'order_update',
    ORDER_CANCEL: 'order_cancel',
    
    // Clients
    CUSTOMER_VIEW: 'customer_view',
    CUSTOMER_CREATE: 'customer_create',
    CUSTOMER_UPDATE: 'customer_update',
    CUSTOMER_DELETE: 'customer_delete',
    
    // Avis
    REVIEW_MODERATE: 'review_moderate',
    
    // Blog
    BLOG_VIEW: 'blog_view',
    BLOG_CREATE: 'blog_create',
    BLOG_UPDATE: 'blog_update',
    BLOG_DELETE: 'blog_delete',
    
    // CMS
    CMS_VIEW: 'cms_view',
    CMS_CREATE: 'cms_create',
    CMS_UPDATE: 'cms_update',
    CMS_DELETE: 'cms_delete',
    
    // Promotions
    PROMO_VIEW: 'promo_view',
    PROMO_CREATE: 'promo_create',
    PROMO_UPDATE: 'promo_update',
    PROMO_DELETE: 'promo_delete',
    
    // Utilisateurs et rôles
    USER_VIEW: 'user_view',
    USER_CREATE: 'user_create',
    USER_UPDATE: 'user_update',
    USER_DELETE: 'user_delete',
    ROLE_MANAGE: 'role_manage',
    
    // Statistiques
    STATS_VIEW: 'stats_view',
    
    // Paramètres
    SETTINGS_VIEW: 'settings_view',
    SETTINGS_UPDATE: 'settings_update'
};

// Vérifier si l'utilisateur est super admin
const isSuperAdmin = (): boolean => {
    const currentUser = authService.getCurrentUser();
    return !!currentUser && currentUser.role === 'super_admin';
};

// Vérifier les permissions d'administration
const checkAdminPermission = (): void => {
    if (!authService.isAdmin()) {
        throw new Error("Permission refusée. Seuls les administrateurs peuvent accéder à ces fonctionnalités.");
    }
};

// Vérifier les permissions de super admin
const checkSuperAdminPermission = (): void => {
    if (!isSuperAdmin()) {
        throw new Error("Permission refusée. Seuls les super administrateurs peuvent accéder à ces fonctionnalités.");
    }
};

// Journaliser une action d'administration
const logAdminAction = async (
    action: AdminAction['action'],
    details: string,
    targetUserId?: string,
    targetUserEmail?: string
): Promise<void> => {
    try {
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser || !authService.isAdmin()) {
            return; // Ne rien journaliser si l'utilisateur n'est pas administrateur
        }
        
        const adminAction: AdminAction = {
            id: `action_${Date.now()}`,
            adminId: currentUser.id,
            adminName: `${currentUser.firstName} ${currentUser.lastName}`,
            targetUserId,
            targetUserEmail,
            action,
            details,
            timestamp: new Date(),
            ipAddress: '127.0.0.1', // Simulé
            userAgent: navigator.userAgent
        };
        
        await dbService.addItem("adminActions", adminAction);
    } catch (error) {
        console.error(`Error in logAdminAction:`, error);
        // Ne pas propager l'erreur pour ne pas bloquer la fonctionnalité principale
    }
};

// ===== GESTION DES UTILISATEURS =====

// Obtenir tous les utilisateurs (admin uniquement)
const getAllUsers = async (): Promise<Omit<User, 'password'>[]> => {
    try {
        checkAdminPermission();
        
        const users = await dbService.getAllItems<User>("users");
        
        // Supprimer les mots de passe et autres données sensibles
        return users.map(user => {
            const { password, resetToken, resetTokenExpiry, twoFactorSecret, ...safeUser } = user;
            return safeUser;
        });
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        throw error;
    }
};

// Créer un nouvel utilisateur (admin uniquement)
const createUser = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: User['role'] = 'customer'
): Promise<Omit<User, 'password'>> => {
    try {
        checkAdminPermission();
        
        // Vérifier les permissions pour créer un rôle particulier
        if (role === 'super_admin' && !isSuperAdmin()) {
            throw new Error("Seuls les super administrateurs peuvent créer d'autres super administrateurs");
        }
        
        if (role === 'admin' && !isSuperAdmin()) {
            throw new Error("Seuls les super administrateurs peuvent créer d'autres administrateurs");
        }
        
        // Vérifier si l'email existe déjà
        const existingUsers = await dbService.getByIndex<User>("users", "email", email);
        
        if (existingUsers && existingUsers.length > 0) {
            throw new Error("Cet email est déjà utilisé");
        }
        
        // Créer le nouvel utilisateur
        const newUser: User = {
            id: `user_${Date.now()}`,
            email,
            password, // Dans une vraie app, ce serait hashé
            firstName,
            lastName,
            role,
            createdAt: new Date()
        };
        
        await dbService.addItem("users", newUser);
        
        // Journaliser l'action
        await logAdminAction(
            'create_user',
            `Création de l'utilisateur ${firstName} ${lastName} (${email}) avec le rôle ${role}`,
            newUser.id,
            email
        );
        
        // Retourner l'utilisateur sans le mot de passe
        const { password: _, ...safeUser } = newUser;
        return safeUser;
    } catch (error) {
        console.error(`Error in createUser for email ${email}:`, error);
        throw error;
    }
};

// Mettre à jour un utilisateur (admin uniquement)
const updateUser = async (
    userId: string,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<Omit<User, 'password'>> => {
    try {
        checkAdminPermission();
        
        const user = await dbService.getItemById<User>("users", userId);
        
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        
        // Vérifier les permissions pour les changements de rôle
        if (updates.role && updates.role !== user.role) {
            if (!isSuperAdmin()) {
                throw new Error("Seuls les super administrateurs peuvent changer les rôles des utilisateurs");
            }
            
            // Empêcher de modifier les super admins si on n'en est pas un
            if (user.role === 'super_admin' && !isSuperAdmin()) {
                throw new Error("Vous ne pouvez pas modifier un super administrateur");
            }
        }
        
        // Vérifier si l'email existe déjà (si changé)
        if (updates.email && updates.email !== user.email) {
            const existingUsers = await dbService.getByIndex<User>("users", "email", updates.email);
            
            if (existingUsers && existingUsers.length > 0) {
                throw new Error("Cet email est déjà utilisé");
            }
        }
        
        // Préparer les mises à jour
        const updatedUser: User = {
            ...user,
            ...updates
        };
        
        await dbService.updateItem("users", updatedUser);
        
        // Journaliser l'action
        const details = Object.keys(updates).map(key => {
            if (key === 'password') {
                return `Mot de passe modifié`;
            }
            return `${key}: ${updates[key]}`;
        }).join(', ');
        
        await logAdminAction(
            'update_user',
            `Mise à jour de l'utilisateur ${user.firstName} ${user.lastName} (${user.email}): ${details}`,
            userId,
            user.email
        );
        
        // Retourner l'utilisateur sans le mot de passe
        const { password, ...safeUser } = updatedUser;
        return safeUser;
    } catch (error) {
        console.error(`Error in updateUser for user ${userId}:`, error);
        throw error;
    }
};

// Suspendre un utilisateur (admin uniquement)
const suspendUser = async (userId: string, reason: string): Promise<boolean> => {
    try {
        checkAdminPermission();
        
        const user = await dbService.getItemById<User>("users", userId);
        
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        
        // Empêcher de suspendre un super admin ou un admin si on n'est pas super admin
        if ((user.role === 'super_admin' || user.role === 'admin') && !isSuperAdmin()) {
            throw new Error("Vous ne pouvez pas suspendre un administrateur");
        }
        
        // Mettre à jour l'utilisateur
        const updatedUser: User = {
            ...user,
            isSuspended: true,
            suspensionReason: reason,
            suspendedAt: new Date()
        };
        
        await dbService.updateItem("users", updatedUser);
        
        // Journaliser l'action
        await logAdminAction(
            'suspend_user',
            `Suspension de l'utilisateur ${user.firstName} ${user.lastName} (${user.email}). Raison: ${reason}`,
            userId,
            user.email
        );
        
        return true;
    } catch (error) {
        console.error(`Error in suspendUser for user ${userId}:`, error);
        throw error;
    }
};

// Réactiver un utilisateur (admin uniquement)
const activateUser = async (userId: string): Promise<boolean> => {
    try {
        checkAdminPermission();
        
        const user = await dbService.getItemById<User>("users", userId);
        
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        
        if (!user.isSuspended) {
            throw new Error("Cet utilisateur n'est pas suspendu");
        }
        
        // Mettre à jour l'utilisateur
        const { isSuspended, suspensionReason, suspendedAt, ...userWithoutSuspension } = user;
        
        await dbService.updateItem("users", userWithoutSuspension);
        
        // Journaliser l'action
        await logAdminAction(
            'activate_user',
            `Réactivation de l'utilisateur ${user.firstName} ${user.lastName} (${user.email})`,
            userId,
            user.email
        );
        
        return true;
    } catch (error) {
        console.error(`Error in activateUser for user ${userId}:`, error);
        throw error;
    }
};

// Supprimer un utilisateur (admin uniquement)
const deleteUser = async (userId: string): Promise<boolean> => {
    try {
        checkAdminPermission();
        
        const user = await dbService.getItemById<User>("users", userId);
        
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        
        // Empêcher de supprimer un super admin ou un admin si on n'est pas super admin
        if ((user.role === 'super_admin' || user.role === 'admin') && !isSuperAdmin()) {
            throw new Error("Vous ne pouvez pas supprimer un administrateur");
        }
        
        // Dans une vraie application, on vérifierait les dépendances (commandes, etc.)
        // et on gérerait la suppression ou l'anonymisation des données associées
        
        await dbService.deleteItem("users", userId);
        
        // Journaliser l'action
        await logAdminAction(
            'delete_user',
            `Suppression de l'utilisateur ${user.firstName} ${user.lastName} (${user.email})`,
            userId,
            user.email
        );
        
        return true;
    } catch (error) {
        console.error(`Error in deleteUser for user ${userId}:`, error);
        throw error;
    }
};

// Obtenir l'historique des actions d'un utilisateur (admin uniquement)
const getUserActivityHistory = async (userId: string): Promise<AdminAction[]> => {
    try {
        checkAdminPermission();
        
        const user = await dbService.getItemById<User>("users", userId);
        
        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }
        
        // Récupérer toutes les actions administratives concernant cet utilisateur
        const allActions = await dbService.getAllItems<AdminAction>("adminActions");
        
        return allActions
            .filter(action => action.targetUserId === userId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error(`Error in getUserActivityHistory for user ${userId}:`, error);
        throw error;
    }
};

// ===== GESTION DES RÔLES ET PERMISSIONS =====

// Obtenir tous les rôles (admin uniquement)
const getAllRoles = async (): Promise<UserRole[]> => {
    try {
        checkAdminPermission();
        
        return await dbService.getAllItems<UserRole>("userRoles");
    } catch (error) {
        console.error("Error in getAllRoles:", error);
        throw error;
    }
};

// Créer un nouveau rôle (super admin uniquement)
const createRole = async (
    name: string,
    permissions: string[],
    description?: string
): Promise<UserRole> => {
    try {
        checkSuperAdminPermission();
        
        // Vérifier que le nom du rôle n'existe pas déjà
        const existingRoles = await dbService.getAllItems<UserRole>("userRoles");
        
        if (existingRoles.some(role => role.name.toLowerCase() === name.toLowerCase())) {
            throw new Error("Un rôle avec ce nom existe déjà");
        }
        
        // Vérifier que les permissions sont valides
        const validPermissions = Object.values(PERMISSIONS);
        for (const permission of permissions) {
            if (!validPermissions.includes(permission)) {
                throw new Error(`Permission invalide: ${permission}`);
            }
        }
        
        const now = new Date();
        
        // Créer le rôle
        const newRole: UserRole = {
            id: `role_${Date.now()}`,
            name,
            permissions,
            description,
            createdAt: now,
            updatedAt: now
        };
        
        await dbService.addItem("userRoles", newRole);
        
        // Journaliser l'action
        await logAdminAction(
            'system_setting',
            `Création du rôle ${name} avec ${permissions.length} permissions`
        );
        
        return newRole;
    } catch (error) {
        console.error(`Error in createRole for name ${name}:`, error);
        throw error;
    }
};

// Mettre à jour un rôle (super admin uniquement)
const updateRole = async (
    roleId: string,
    updates: Partial<Omit<UserRole, 'id' | 'createdAt'>>
): Promise<UserRole> => {
    try {
        checkSuperAdminPermission();
        
        const role = await dbService.getItemById<UserRole>("userRoles", roleId);
        
        if (!role) {
            throw new Error("Rôle non trouvé");
        }
        
        // Vérifier que le nom n'existe pas déjà (si changé)
        if (updates.name && updates.name !== role.name) {
            const existingRoles = await dbService.getAllItems<UserRole>("userRoles");
            
            if (existingRoles.some(r => r.name.toLowerCase() === updates.name!.toLowerCase() && r.id !== roleId)) {
                throw new Error("Un rôle avec ce nom existe déjà");
            }
        }
        
        // Vérifier que les permissions sont valides
        if (updates.permissions) {
            const validPermissions = Object.values(PERMISSIONS);
            for (const permission of updates.permissions) {
                if (!validPermissions.includes(permission)) {
                    throw new Error(`Permission invalide: ${permission}`);
                }
            }
        }
        
        // Mettre à jour le rôle
        const updatedRole: UserRole = {
            ...role,
            ...updates,
            updatedAt: new Date()
        };
        
        await dbService.updateItem("userRoles", updatedRole);
        
        // Journaliser l'action
        await logAdminAction(
            'system_setting',
            `Mise à jour du rôle ${role.name}`
        );
        
        return updatedRole;
    } catch (error) {
        console.error(`Error in updateRole for role ${roleId}:`, error);
        throw error;
    }
};

// Supprimer un rôle (super admin uniquement)
const deleteRole = async (roleId: string): Promise<boolean> => {
    try {
        checkSuperAdminPermission();
        
        const role = await dbService.getItemById<UserRole>("userRoles", roleId);
        
        if (!role) {
            throw new Error("Rôle non trouvé");
        }
        
        // Vérifier si des utilisateurs utilisent ce rôle
        // Dans une vraie application avec des rôles personnalisés
        
        await dbService.deleteItem("userRoles", roleId);
        
        // Journaliser l'action
        await logAdminAction(
            'system_setting',
            `Suppression du rôle ${role.name}`
        );
        
        return true;
    } catch (error) {
        console.error(`Error in deleteRole for role ${roleId}:`, error);
        throw error;
    }
};

// Obtenir toutes les permissions disponibles (admin uniquement)
const getAllPermissions = async (): Promise<Permission[]> => {
    try {
        checkAdminPermission();
        
        // Convertir l'objet PERMISSIONS en tableau
        return Object.entries(PERMISSIONS).map(([key, id]) => {
            // Définir la catégorie en fonction du préfixe
            let category = 'Other';
            if (id.startsWith('product_')) category = 'Products';
            else if (id.startsWith('order_')) category = 'Orders';
            else if (id.startsWith('customer_')) category = 'Customers';
            else if (id.startsWith('review_')) category = 'Reviews';
            else if (id.startsWith('blog_')) category = 'Blog';
            else if (id.startsWith('cms_')) category = 'CMS';
            else if (id.startsWith('promo_')) category = 'Promotions';
            else if (id.startsWith('user_') || id.startsWith('role_')) category = 'Users & Roles';
            else if (id.startsWith('stats_')) category = 'Statistics';
            else if (id.startsWith('settings_')) category = 'Settings';
            
            // Générer une description basée sur l'ID
            const formattedId = id.replace(/_/g, ' ');
            const description = `Permission to ${formattedId}`;
            
            return {
                id,
                name: key,
                category,
                description
            };
        });
    } catch (error) {
        console.error("Error in getAllPermissions:", error);
        throw error;
    }
};

// ===== JOURNAL D'AUDIT =====

// Obtenir le journal d'audit (super admin uniquement)
const getAuditLog = async (
    startDate?: Date,
    endDate?: Date,
    adminId?: string,
    actionType?: AdminAction['action']
): Promise<AdminAction[]> => {
    try {
        checkSuperAdminPermission();
        
        let actions = await dbService.getAllItems<AdminAction>("adminActions");
        
        // Appliquer les filtres
        if (startDate) {
            actions = actions.filter(action => new Date(action.timestamp) >= startDate);
        }
        
        if (endDate) {
            actions = actions.filter(action => new Date(action.timestamp) <= endDate);
        }
        
        if (adminId) {
            actions = actions.filter(action => action.adminId === adminId);
        }
        
        if (actionType) {
            actions = actions.filter(action => action.action === actionType);
        }
        
        // Trier par date décroissante
        return actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Error in getAuditLog:", error);
        throw error;
    }
};

// ===== INITIALISATION =====

// Initialiser les rôles par défaut
const initDefaultRoles = async (): Promise<void> => {
    try {
        const existingRoles = await dbService.getAllItems<UserRole>("userRoles");
        
        if (existingRoles.length === 0) {
            console.log("Initializing default user roles...");
            
            const now = new Date();
            
            // Rôle super_admin (toutes les permissions)
            const superAdminRole: UserRole = {
                id: `role_super_admin`,
                name: "Super Admin",
                permissions: Object.values(PERMISSIONS),
                description: "Accès complet à toutes les fonctionnalités du système",
                createdAt: now,
                updatedAt: now
            };
            
            // Rôle admin (la plupart des permissions sauf gestion des utilisateurs et rôles)
            const adminRole: UserRole = {
                id: `role_admin`,
                name: "Admin",
                permissions: Object.values(PERMISSIONS).filter(p => 
                    !p.startsWith('user_') && p !== 'role_manage' && p !== 'settings_update'
                ),
                description: "Accès à la plupart des fonctionnalités administratives excepté la gestion des utilisateurs",
                createdAt: now,
                updatedAt: now
            };
            
            // Rôle manager (gestion des produits, commandes, blog)
            const managerRole: UserRole = {
                id: `role_manager`,
                name: "Manager",
                permissions: [
                    PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_UPDATE,
                    PERMISSIONS.ORDER_VIEW, PERMISSIONS.ORDER_UPDATE,
                    PERMISSIONS.CUSTOMER_VIEW,
                    PERMISSIONS.REVIEW_MODERATE,
                    PERMISSIONS.BLOG_VIEW, PERMISSIONS.BLOG_CREATE, PERMISSIONS.BLOG_UPDATE,
                    PERMISSIONS.CMS_VIEW, PERMISSIONS.CMS_UPDATE,
                    PERMISSIONS.PROMO_VIEW, PERMISSIONS.PROMO_CREATE, PERMISSIONS.PROMO_UPDATE,
                    PERMISSIONS.STATS_VIEW
                ],
                description: "Gestion quotidienne du site et du contenu",
                createdAt: now,
                updatedAt: now
            };
            
            // Ajouter les rôles
            await dbService.addItem("userRoles", superAdminRole);
            await dbService.addItem("userRoles", adminRole);
            await dbService.addItem("userRoles", managerRole);
            
            console.log("Default user roles initialized!");
        }
    } catch (error) {
        console.error("Error in initDefaultRoles:", error);
    }
};

export const userManagementService = {
    // Gestion des utilisateurs
    getAllUsers,
    createUser,
    updateUser,
    suspendUser,
    activateUser,
    deleteUser,
    getUserActivityHistory,
    // Gestion des rôles
    getAllRoles,
    createRole,
    updateRole,
    deleteRole,
    getAllPermissions,
    // Journal d'audit
    getAuditLog,
    logAdminAction,
    // Initialisation
    initDefaultRoles,
    // Constantes
    PERMISSIONS
};