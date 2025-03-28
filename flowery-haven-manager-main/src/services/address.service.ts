// src/services/address.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

export interface Address {
  id: string;
  userId: string;
  nickname: string;
  type: "shipping" | "billing";
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get all addresses for the current user
const getUserAddresses = async (): Promise<Address[]> => {
  try {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Utilisateur non connecté");
    }
    
    // Get addresses by userId index
    const addresses = await dbService.getByIndex<Address>('addresses', 'userId', currentUser.id);
    
    return addresses || [];
  } catch (error) {
    console.error('Error getting user addresses:', error);
    // Return empty array on error rather than throwing
    return [];
  }
};

// Get addresses by type for the current user
const getAddressesByType = async (type: "shipping" | "billing"): Promise<Address[]> => {
  try {
    const addresses = await getUserAddresses();
    return addresses.filter(address => address.type === type);
  } catch (error) {
    console.error(`Error getting ${type} addresses:`, error);
    return [];
  }
};

// Get default address by type
const getDefaultAddress = async (type: "shipping" | "billing"): Promise<Address | null> => {
  try {
    const addresses = await getAddressesByType(type);
    return addresses.find(address => address.isDefault) || null;
  } catch (error) {
    console.error(`Error getting default ${type} address:`, error);
    return null;
  }
};

// Add a new address
const addAddress = async (addressData: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Address> => {
  try {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Utilisateur non connecté");
    }
    
    // Handle default address: If this is set as default, update other addresses of same type
    if (addressData.isDefault) {
      const addresses = await getAddressesByType(addressData.type);
      
      // Update existing default addresses to non-default
      for (const address of addresses) {
        if (address.isDefault) {
          await dbService.updateItem<Address>('addresses', {
            ...address,
            isDefault: false,
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Create new address
    const now = new Date();
    const newAddress: Address = {
      id: `addr_${Date.now()}`,
      userId: currentUser.id,
      ...addressData,
      createdAt: now,
      updatedAt: now
    };
    
    await dbService.addItem<Address>('addresses', newAddress);
    
    return newAddress;
  } catch (error) {
    console.error('Error adding address:', error);
    throw error;
  }
};

// Update an existing address
const updateAddress = async (addressId: string, addressData: Partial<Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Address> => {
  try {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Utilisateur non connecté");
    }
    
    // Get the address to update
    const address = await dbService.getItemById<Address>('addresses', addressId);
    
    if (!address) {
      throw new Error("Adresse non trouvée");
    }
    
    // Verify ownership
    if (address.userId !== currentUser.id) {
      throw new Error("Vous n'êtes pas autorisé à modifier cette adresse");
    }
    
    // Handle default address logic
    if (addressData.isDefault && !address.isDefault) {
      // If setting this address as default, update other addresses of same type
      const addresses = await getAddressesByType(address.type);
      
      for (const addr of addresses) {
        if (addr.isDefault && addr.id !== addressId) {
          await dbService.updateItem<Address>('addresses', {
            ...addr,
            isDefault: false,
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Update the address
    const updatedAddress: Address = {
      ...address,
      ...addressData,
      updatedAt: new Date()
    };
    
    await dbService.updateItem<Address>('addresses', updatedAddress);
    
    return updatedAddress;
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

// Delete an address
const deleteAddress = async (addressId: string): Promise<boolean> => {
  try {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Utilisateur non connecté");
    }
    
    // Get the address to delete
    const address = await dbService.getItemById<Address>('addresses', addressId);
    
    if (!address) {
      throw new Error("Adresse non trouvée");
    }
    
    // Verify ownership
    if (address.userId !== currentUser.id) {
      throw new Error("Vous n'êtes pas autorisé à supprimer cette adresse");
    }
    
    // Delete the address
    await dbService.deleteItem('addresses', addressId);
    
    // If this was a default address, set another address as default if available
    if (address.isDefault) {
      const addresses = await getAddressesByType(address.type);
      
      if (addresses.length > 0) {
        // Set the first available address as default
        await dbService.updateItem<Address>('addresses', {
          ...addresses[0],
          isDefault: true,
          updatedAt: new Date()
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

// Set an address as default
const setDefaultAddress = async (addressId: string): Promise<Address> => {
  try {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Utilisateur non connecté");
    }
    
    // Get the address to set as default
    const address = await dbService.getItemById<Address>('addresses', addressId);
    
    if (!address) {
      throw new Error("Adresse non trouvée");
    }
    
    // Verify ownership
    if (address.userId !== currentUser.id) {
      throw new Error("Vous n'êtes pas autorisé à modifier cette adresse");
    }
    
    // Update other addresses of the same type
    const addresses = await getAddressesByType(address.type);
    
    for (const addr of addresses) {
      if (addr.isDefault && addr.id !== addressId) {
        await dbService.updateItem<Address>('addresses', {
          ...addr,
          isDefault: false,
          updatedAt: new Date()
        });
      }
    }
    
    // Set this address as default
    const updatedAddress: Address = {
      ...address,
      isDefault: true,
      updatedAt: new Date()
    };
    
    await dbService.updateItem<Address>('addresses', updatedAddress);
    
    return updatedAddress;
  } catch (error) {
    console.error('Error setting default address:', error);
    throw error;
  }
};

export const addressService = {
  getUserAddresses,
  getAddressesByType,
  getDefaultAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};