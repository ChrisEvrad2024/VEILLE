// src/services/user.service.ts
import { dbService } from './db.service';
import { v4 as uuidv4 } from 'uuid';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
    role: 'customer' | 'admin' | 'manager';
    status: 'active' | 'inactive' | 'banned';
    lastLogin?: string;
    avatar?: string;
}

class UserService {
    /**
     * Récupère tous les utilisateurs
     */
    async getAllUsers(): Promise<User[]> {
        try {
            const users = await dbService.getAllItems<User>('users');
            return users;
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }

    /**
     * Récupère un utilisateur par son ID
     */
    async getUserById(userId: string): Promise<User | null> {
        try {
            const user = await dbService.getItemById<User>('users', userId);
            return user;
        } catch (error) {
            console.error(`Error getting user ${userId}:`, error);
            return null;
        }
    }

    /**
     * Récupère un utilisateur par son email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const user = await dbService.getOneByIndex<User>('users', 'email', email);
            return user;
        } catch (error) {
            console.error(`Error getting user by email ${email}:`, error);
            return null;
        }
    }

    /**
     * Récupère les utilisateurs ayant un rôle spécifique
     */
    async getUsersByRole(role: 'customer' | 'admin' | 'manager'): Promise<User[]> {
        try {
            const users = await dbService.getByIndex<User>('users', 'role', role);
            return users;
        } catch (error) {
            console.error(`Error getting users by role ${role}:`, error);
            return [];
        }
    }

    /**
     * Crée un nouvel utilisateur
     */
    async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User | null> {
        try {
            // Vérifier si l'email existe déjà
            const existingUser = await this.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('Un utilisateur avec cet email existe déjà');
            }

            const now = new Date().toISOString();
            const newUser: User = {
                id: uuidv4(),
                ...userData,
                createdAt: now,
                updatedAt: now
            };

            await dbService.addItem('users', newUser);
            return newUser;
        } catch (error) {
            console.error('Error creating user:', error);
            return null;
        }
    }

    /**
     * Met à jour un utilisateur existant
     */
    async updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
        try {
            const existingUser = await this.getUserById(userId);
            if (!existingUser) {
                throw new Error('Utilisateur non trouvé');
            }

            // Si l'email est modifié, vérifier qu'il n'existe pas déjà
            if (userData.email && userData.email !== existingUser.email) {
                const userWithEmail = await this.getUserByEmail(userData.email);
                if (userWithEmail && userWithEmail.id !== userId) {
                    throw new Error('Un utilisateur avec cet email existe déjà');
                }
            }

            const updatedUser: User = {
                ...existingUser,
                ...userData,
                updatedAt: new Date().toISOString()
            };

            await dbService.updateItem('users', updatedUser);
            return updatedUser;
        } catch (error) {
            console.error(`Error updating user ${userId}:`, error);
            return null;
        }
    }

    /**
     * Supprime un utilisateur
     */
    async deleteUser(userId: string): Promise<boolean> {
        try {
            return await dbService.deleteItem('users', userId);
        } catch (error) {
            console.error(`Error deleting user ${userId}:`, error);
            return false;
        }
    }

    /**
     * Met à jour la date de dernière connexion
     */
    async updateLastLogin(userId: string): Promise<boolean> {
        try {
            const user = await this.getUserById(userId);
            if (!user) return false;

            const updatedUser = {
                ...user,
                lastLogin: new Date().toISOString()
            };

            await dbService.updateItem('users', updatedUser);
            return true;
        } catch (error) {
            console.error(`Error updating last login for user ${userId}:`, error);
            return false;
        }
    }

    /**
     * Récupère les statistiques des utilisateurs
     */
    async getUserStatistics(): Promise<{
        totalUsers: number;
        activeUsers: number;
        newUsersThisMonth: number;
        usersByRole: Record<string, number>;
    }> {
        try {
            const users = await this.getAllUsers();

            // Compter les utilisateurs actifs
            const activeUsers = users.filter(user => user.status === 'active').length;

            // Compter les nouveaux utilisateurs ce mois-ci
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const newUsersThisMonth = users.filter(user =>
                new Date(user.createdAt) >= startOfMonth
            ).length;

            // Compter les utilisateurs par rôle
            const usersByRole = users.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return {
                totalUsers: users.length,
                activeUsers,
                newUsersThisMonth,
                usersByRole
            };
        } catch (error) {
            console.error('Error getting user statistics:', error);
            return {
                totalUsers: 0,
                activeUsers: 0,
                newUsersThisMonth: 0,
                usersByRole: {}
            };
        }
    }
}

export const userService = new UserService();