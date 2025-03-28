// src/services/address.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

// Types pour les adresses
export interface Address {
    id: string;
    userId: string;
    nickname: string;
    type: 'shipping' | 'billing';
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
    isDefault: boolean;
}

// Récupérer les adresses de l'utilisateur
const getUserAddresses = async (): Promise<Address[]> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            return [];
        }

        return await dbService.getByIndex<Address>("addresses", "userId", currentUser.id);
    } catch (error) {
        console.error("Error in getUserAddresses:", error);
        return [];
    }
};

// Récupérer une adresse par son ID
const getAddressById = async (addressId: string): Promise<Address | null> => {
    try {
        const address = await dbService.getItemById<Address>("addresses", addressId);

        if (!address) {
            return null;
        }

        // Vérifier que l'utilisateur actuel est bien le propriétaire de l'adresse
        const currentUser = authService.getCurrentUser();

        if (!currentUser || (address.userId !== currentUser.id && !authService.isAdmin())) {
            return null;
        }

        return address;
    } catch (error) {
        console.error(`Error in getAddressById for address ${addressId}:`, error);
        return null;
    }
};

// Ajouter une adresse
const addAddress = async (address: Omit<Address, 'id' | 'userId'>): Promise<Address> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Si l'adresse est définie par défaut, mettre à jour les autres adresses du même type
        if (address.isDefault) {
            await updateDefaultAddress(address.type);
        }

        // Créer la nouvelle adresse
        const newAddress: Address = {
            ...address,
            id: `addr_${Date.now()}`,
            userId: currentUser.id
        };

        // Enregistrer l'adresse
        await dbService.addItem("addresses", newAddress);

        return newAddress;
    } catch (error) {
        console.error("Error in addAddress:", error);
        throw error;
    }
};

// Mettre à jour une adresse
const updateAddress = async (address: Address): Promise<Address> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Vérifier que l'utilisateur est le propriétaire
        const existingAddress = await dbService.getItemById<Address>("addresses", address.id);

        if (!existingAddress || existingAddress.userId !== currentUser.id) {
            throw new Error("Permission refusée");
        }

        // Si l'adresse est définie par défaut, mettre à jour les autres adresses du même type
        if (address.isDefault) {
            await updateDefaultAddress(address.type, address.id);
        }

        // Mettre à jour l'adresse
        await dbService.updateItem("addresses", address);

        return address;
    } catch (error) {
        console.error(`Error in updateAddress for address ${address.id}:`, error);
        throw error;
    }
};

// Supprimer une adresse
const deleteAddress = async (addressId: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Vérifier que l'utilisateur est le propriétaire
        const existingAddress = await dbService.getItemById<Address>("addresses", addressId);

        if (!existingAddress || existingAddress.userId !== currentUser.id) {
            throw new Error("Permission refusée");
        }

        // Supprimer l'adresse
        await dbService.deleteItem("addresses", addressId);

        return true;
    } catch (error) {
        console.error(`Error in deleteAddress for address ${addressId}:`, error);
        return false;
    }
};

// Utilitaire pour mettre à jour les adresses par défaut
const updateDefaultAddress = async (type: 'shipping' | 'billing', exceptId?: string): Promise<void> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            return;
        }

        // Récupérer toutes les adresses de l'utilisateur du type spécifié
        const addresses = await dbService.getByIndex<Address>("addresses", "userId", currentUser.id);
        const typeAddresses = addresses.filter(addr => addr.type === type);

        // Mettre à jour les adresses de ce type pour qu'elles ne soient plus par défaut
        for (const addr of typeAddresses) {
            if (addr.id !== exceptId && addr.isDefault) {
                await dbService.updateItem("addresses", {
                    ...addr,
                    isDefault: false
                });
            }
        }
    } catch (error) {
        console.error(`Error in updateDefaultAddress for type ${type}:`, error);
        throw error;
    }
};

// Obtenir l'adresse par défaut d'un type
const getDefaultAddress = async (type: 'shipping' | 'billing'): Promise<Address | null> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            return null;
        }

        // Récupérer toutes les adresses de l'utilisateur
        const addresses = await dbService.getByIndex<Address>("addresses", "userId", currentUser.id);

        // Trouver l'adresse par défaut du type spécifié
        return addresses.find(addr => addr.type === type && addr.isDefault) || null;
    } catch (error) {
        console.error(`Error in getDefaultAddress for type ${type}:`, error);
        return null;
    }
};

export const addressService = {
    getUserAddresses,
    getAddressById,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress
};