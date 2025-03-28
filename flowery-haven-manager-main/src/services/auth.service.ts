// src/services/auth.service.ts (enhanced)
import { dbService } from './db.service';

// Types d'utilisateurs
export interface User {
    id: string;
    email: string;
    password: string; // Dans une vraie app, ce serait hashé
    firstName: string;
    lastName: string;
    role: "customer" | "admin" | "super_admin";
    createdAt: Date;
    lastLogin?: Date;
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    resetToken?: string;
    resetTokenExpiry?: Date;
}

// Type pour les modifications de profil
export interface ProfileUpdate {
    firstName?: string;
    lastName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}

// Enregistrer un nouvel utilisateur
const register = async (userData: Omit<User, 'id' | 'role' | 'createdAt'>): Promise<Omit<User, 'password'>> => {
    try {
        // Vérifier si l'email existe déjà
        const existingUsers = await dbService.getByIndex<User>("users", "email", userData.email);

        if (existingUsers && existingUsers.length > 0) {
            throw new Error("Cet email est déjà utilisé");
        }

        // Créer le nouvel utilisateur
        const newUser: User = {
            ...userData,
            id: `user_${Date.now()}`,
            role: "customer",
            createdAt: new Date(),
            twoFactorEnabled: false
        };

        // Enregistrer dans IndexedDB
        await dbService.addItem("users", newUser);

        // Créer les données de session (sans le mot de passe)
        const { password, ...sessionUser } = newUser;

        // Stocker dans localStorage pour la session
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify(sessionUser));

        return sessionUser;
    } catch (error) {
        console.error("Error in register:", error);
        throw error;
    }
};

// Connexion utilisateur
const login = async (email: string, password: string): Promise<Omit<User, 'password'>> => {
    try {
        // Simulation de login admin pour faciliter les tests
        if (email === "admin@admin.com") {
            const adminUser = {
                id: "admin_1",
                email: "admin@admin.com",
                firstName: "Admin",
                lastName: "System",
                role: "admin" as const,
                createdAt: new Date()
            };

            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("user", JSON.stringify(adminUser));

            return adminUser;
        }

        // Pour un utilisateur normal, vérifier dans la base de données
        const users = await dbService.getByIndex<User>("users", "email", email);

        if (!users || users.length === 0 || users[0].password !== password) {
            throw new Error("Email ou mot de passe incorrect");
        }

        const user = users[0];

        // Vérifier si l'authentification à deux facteurs est activée
        if (user.twoFactorEnabled) {
            // Ne pas connecter tout de suite, stocker l'ID pour la vérification 2FA
            localStorage.setItem("pendingTwoFactorAuth", user.id);
            throw new Error("2FA_REQUIRED");
        }

        // Mettre à jour le dernier login
        await dbService.updateItem("users", {
            ...user,
            lastLogin: new Date()
        });

        // Créer les données de session (sans le mot de passe)
        const { password: _, ...sessionUser } = user;

        // Stocker dans localStorage pour la session
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify(sessionUser));

        return sessionUser;
    } catch (error) {
        console.error("Error in login:", error);
        throw error;
    }
};

// Déconnexion
const logout = (): void => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("pendingTwoFactorAuth");
};

// Vérifier si l'utilisateur est connecté
const isAuthenticated = (): boolean => {
    return localStorage.getItem("isAuthenticated") === "true";
};

// Obtenir l'utilisateur courant
const getCurrentUser = (): Omit<User, 'password'> | null => {
    const userJson = localStorage.getItem("user");
    return userJson ? JSON.parse(userJson) : null;
};

// Vérifier si l'utilisateur est admin
const isAdmin = (): boolean => {
    const user = getCurrentUser();
    return !!user && (user.role === "admin" || user.role === "super_admin");
};

// =========== NOUVELLES FONCTIONS ===========

// Demander un token de réinitialisation de mot de passe
const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
        const users = await dbService.getByIndex<User>("users", "email", email);

        if (!users || users.length === 0) {
            // Pour éviter de révéler l'existence d'un compte, on simule un succès
            return true;
        }

        const user = users[0];

        // Générer un token unique
        const resetToken = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

        // Définir une expiration (24 heures)
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 24);

        // Mettre à jour l'utilisateur avec le token
        await dbService.updateItem("users", {
            ...user,
            resetToken,
            resetTokenExpiry
        });

        // Dans une vraie application, on enverrait un email avec le lien
        console.log(`Reset token for ${email}: ${resetToken}`);

        return true;
    } catch (error) {
        console.error("Error in requestPasswordReset:", error);
        throw error;
    }
};

// Réinitialiser le mot de passe avec un token
const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
        // Trouver l'utilisateur avec ce token
        const allUsers = await dbService.getAllItems<User>("users");
        const user = allUsers.find(u => u.resetToken === token);

        if (!user) {
            throw new Error("Token invalide");
        }

        // Vérifier si le token a expiré
        if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
            throw new Error("Token expiré");
        }

        // Mettre à jour le mot de passe et effacer le token
        await dbService.updateItem("users", {
            ...user,
            password: newPassword,
            resetToken: undefined,
            resetTokenExpiry: undefined
        });

        return true;
    } catch (error) {
        console.error("Error in resetPassword:", error);
        throw error;
    }
};

// Activer l'authentification à deux facteurs
const enableTwoFactorAuth = async (password: string): Promise<string> => {
    try {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Vérifier le mot de passe actuel
        const users = await dbService.getByIndex<User>("users", "email", currentUser.email);

        if (!users || users.length === 0 || users[0].password !== password) {
            throw new Error("Mot de passe incorrect");
        }

        const user = users[0];

        // Générer un secret pour 2FA (dans une vraie app, on utiliserait une bibliothèque comme speakeasy)
        const twoFactorSecret = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

        // Mettre à jour l'utilisateur avec le secret (mais ne pas activer 2FA tout de suite)
        await dbService.updateItem("users", {
            ...user,
            twoFactorSecret
        });

        // Retourner le secret pour générer un QR code
        return twoFactorSecret;
    } catch (error) {
        console.error("Error in enableTwoFactorAuth:", error);
        throw error;
    }
};

// Confirmer l'activation de 2FA
const confirmTwoFactorAuth = async (token: string): Promise<boolean> => {
    try {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const users = await dbService.getByIndex<User>("users", "email", currentUser.email);

        if (!users || users.length === 0) {
            throw new Error("Utilisateur non trouvé");
        }

        const user = users[0];

        // Vérifier le token (dans une vraie app, on utiliserait speakeasy.totp.verify)
        // Ici on simule simplement en vérifiant que le token n'est pas vide
        if (!token || token.length < 6) {
            throw new Error("Token invalide");
        }

        // Activer 2FA
        await dbService.updateItem("users", {
            ...user,
            twoFactorEnabled: true
        });

        return true;
    } catch (error) {
        console.error("Error in confirmTwoFactorAuth:", error);
        throw error;
    }
};

// Vérifier un code 2FA
const verifyTwoFactorToken = async (token: string): Promise<Omit<User, 'password'>> => {
    try {
        const pendingUserId = localStorage.getItem("pendingTwoFactorAuth");

        if (!pendingUserId) {
            throw new Error("Aucune authentification en attente");
        }

        const user = await dbService.getItemById<User>("users", pendingUserId);

        if (!user) {
            throw new Error("Utilisateur non trouvé");
        }

        // Vérifier le token (dans une vraie app, on utiliserait speakeasy.totp.verify)
        // Ici on simule simplement en vérifiant que le token n'est pas vide
        if (!token || token.length < 6) {
            throw new Error("Token invalide");
        }

        // Mettre à jour le dernier login
        await dbService.updateItem("users", {
            ...user,
            lastLogin: new Date()
        });

        // Supprimer l'authentification en attente
        localStorage.removeItem("pendingTwoFactorAuth");

        // Créer les données de session (sans le mot de passe)
        const { password, ...sessionUser } = user;

        // Stocker dans localStorage pour la session
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify(sessionUser));

        return sessionUser;
    } catch (error) {
        console.error("Error in verifyTwoFactorToken:", error);
        throw error;
    }
};

// Désactiver l'authentification à deux facteurs
const disableTwoFactorAuth = async (password: string): Promise<boolean> => {
    try {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Vérifier le mot de passe actuel
        const users = await dbService.getByIndex<User>("users", "email", currentUser.email);

        if (!users || users.length === 0 || users[0].password !== password) {
            throw new Error("Mot de passe incorrect");
        }

        const user = users[0];

        // Désactiver 2FA
        await dbService.updateItem("users", {
            ...user,
            twoFactorEnabled: false,
            twoFactorSecret: undefined
        });

        return true;
    } catch (error) {
        console.error("Error in disableTwoFactorAuth:", error);
        throw error;
    }
};

// Mettre à jour le profil de l'utilisateur
const updateUserProfile = async (updates: ProfileUpdate): Promise<Omit<User, 'password'>> => {
    try {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const users = await dbService.getByIndex<User>("users", "email", currentUser.email);

        if (!users || users.length === 0) {
            throw new Error("Utilisateur non trouvé");
        }

        const user = users[0];

        // Si changement de mot de passe, vérifier l'ancien
        if (updates.newPassword && updates.currentPassword) {
            if (user.password !== updates.currentPassword) {
                throw new Error("Mot de passe actuel incorrect");
            }
        }

        // Si changement d'email, vérifier qu'il n'est pas déjà utilisé
        if (updates.email && updates.email !== user.email) {
            const existingUsers = await dbService.getByIndex<User>("users", "email", updates.email);

            if (existingUsers && existingUsers.length > 0) {
                throw new Error("Cet email est déjà utilisé");
            }
        }

        // Préparer les mises à jour
        const updatedUser: User = {
            ...user,
            firstName: updates.firstName || user.firstName,
            lastName: updates.lastName || user.lastName,
            email: updates.email || user.email,
            password: updates.newPassword || user.password
        };

        // Mettre à jour l'utilisateur
        await dbService.updateItem("users", updatedUser);

        // Mettre à jour la session
        const { password, ...sessionUser } = updatedUser;
        localStorage.setItem("user", JSON.stringify(sessionUser));

        return sessionUser;
    } catch (error) {
        console.error("Error in updateUserProfile:", error);
        throw error;
    }
};

export const authService = {
    register,
    login,
    logout,
    isAuthenticated,
    getCurrentUser,
    isAdmin,
    // Nouvelles fonctions
    requestPasswordReset,
    resetPassword,
    enableTwoFactorAuth,
    confirmTwoFactorAuth,
    verifyTwoFactorToken,
    disableTwoFactorAuth,
    updateUserProfile
};