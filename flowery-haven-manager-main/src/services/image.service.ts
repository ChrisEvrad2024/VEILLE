// src/services/image.service.ts
import { dbService } from './db.service';

export interface StoredImage {
    id: string;
    data: string; // Base64 string
    filename: string;
    type: string;
    size: number;
    createdAt: Date;
}

/**
 * Service pour gérer le stockage et la récupération des images
 * Pour une application de production, ce service devrait être remplacé
 * par un service qui stocke les images sur un CDN ou un service de stockage
 */
const storeImage = async (file: File): Promise<string> => {
    try {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (event) => {
                if (!event.target || typeof event.target.result !== 'string') {
                    reject(new Error('Failed to read file'));
                    return;
                }

                const base64Data = event.target.result;

                // Stocker l'image dans IndexedDB
                const imageData: StoredImage = {
                    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    data: base64Data,
                    filename: file.name,
                    type: file.type,
                    size: file.size,
                    createdAt: new Date()
                };

                try {
                    await dbService.addItem('images', imageData);
                    resolve(imageData.id); // Retourner l'ID de l'image pour référence
                } catch (dbError) {
                    console.error('Error storing image in database:', dbError);
                    reject(dbError);
                }
            };

            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };

            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Error in storeImage:', error);
        throw error;
    }
};

const getImage = async (id: string): Promise<StoredImage | null> => {
    try {
        return await dbService.getItemById<StoredImage>('images', id);
    } catch (error) {
        console.error(`Error retrieving image with ID ${id}:`, error);
        return null;
    }
};

const deleteImage = async (id: string): Promise<boolean> => {
    try {
        return await dbService.deleteItem('images', id);
    } catch (error) {
        console.error(`Error deleting image with ID ${id}:`, error);
        return false;
    }
};

// Convertir un fichier en dataURL (Base64)
const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Convertir plusieurs fichiers en DataURLs
const filesToDataURLs = async (files: File[]): Promise<string[]> => {
    const promises = Array.from(files).map(file => fileToDataURL(file));
    return Promise.all(promises);
};

export const imageService = {
    storeImage,
    getImage,
    deleteImage,
    fileToDataURL,
    filesToDataURLs
};