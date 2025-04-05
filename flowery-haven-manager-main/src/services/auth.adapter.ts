// src/services/adapters/auth.adapter.ts

import { authService, User } from '@/services/auth.service';
import { toast } from 'sonner';

// Type for registration data
export interface RegistrationData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

// Enhanced auth adapter with better error handling and consistent behavior
const login = async (email: string, password: string): Promise<Omit<User, 'password'>> => {
    try {
        // Get intended destination before login attempt
        const redirectPath = localStorage.getItem('authRedirectPath');

        const user = await authService.login(email, password);

        // Clear any stored redirect paths on successful login
        // We'll keep this value accessible in the return object but remove from storage
        // to prevent unwanted redirects on future logins
        localStorage.removeItem('authRedirectPath');

        return user;
    } catch (error) {
        // Keep the original error message without prefixing
        const message = error instanceof Error ? error.message : 'Erreur lors de la connexion';

        // Special handling for 2FA if needed
        if (message === '2FA_REQUIRED') {
            throw new Error('2FA_REQUIRED');
        }

        // Preserve original error message
        throw new Error(message);
    }
};

const logout = (): void => {
    try {
        authService.logout();

        // Clear any stored paths
        localStorage.removeItem('authRedirectPath');
    } catch (error) {
        console.error('Logout error:', error);
        // Still attempt to clear storage even if service fails
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
    }
};

const register = async (data: RegistrationData): Promise<Omit<User, 'password'>> => {
    try {
        return await authService.register(data);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
        throw new Error(`Échec d'inscription: ${message}`);
    }
};

const isAuthenticated = (): boolean => {
    return authService.isAuthenticated();
};

const isAdmin = (): boolean => {
    return authService.isAdmin();
};

const getCurrentUser = (): Omit<User, 'password'> | null => {
    return authService.getCurrentUser();
};

const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
        return await authService.requestPasswordReset(email);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur lors de la demande de réinitialisation';
        throw new Error(`Échec de la demande: ${message}`);
    }
};

const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
        return await authService.resetPassword(token, newPassword);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur lors de la réinitialisation';
        throw new Error(`Échec de la réinitialisation: ${message}`);
    }
};

const updateUserProfile = async (updates: any): Promise<Omit<User, 'password'>> => {
    try {
        return await authService.updateUserProfile(updates);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil';
        throw new Error(`Échec de la mise à jour: ${message}`);
    }
};

// Store the path user was trying to access for post-login redirection
const storeRedirectPath = (path: string): void => {
    if (path && !path.includes('/auth/')) {
        localStorage.setItem('authRedirectPath', path);
    }
};

export const authAdapter = {
    login,
    logout,
    register,
    isAuthenticated,
    isAdmin,
    getCurrentUser,
    requestPasswordReset,
    resetPassword,
    updateUserProfile,
    storeRedirectPath
};