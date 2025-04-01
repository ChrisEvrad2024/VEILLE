import { dbService } from './db.service';
import { authService } from './auth.service';

export interface MediaItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; 
  dataUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

class MediaService {
  // Upload d'image (convertit en base64 pour stockage dans IndexedDB)
  async uploadMedia(file: File): Promise<MediaItem> {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    const currentUser = authService.getCurrentUser();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string;
          
          const mediaItem: MediaItem = {
            id: `media_${Date.now()}`,
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file), // Pour affichage temporaire
            dataUrl, // Pour stockage persistant
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: currentUser.id
          };
          
          await dbService.addItem('media', mediaItem);
          resolve(mediaItem);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  // Récupérer tous les médias
  async getAllMedia(): Promise<MediaItem[]> {
    const items = await dbService.getAllItems<MediaItem>('media');
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Récupérer un média par son ID
  async getMediaById(id: string): Promise<MediaItem | null> {
    return await dbService.getItemById<MediaItem>('media', id);
  }
  
  // Supprimer un média
  async deleteMedia(id: string): Promise<boolean> {
    if (!authService.isAdmin()) {
      throw new Error('Admin access required');
    }
    
    return await dbService.deleteItem('media', id);
  }
}

export const mediaService = new MediaService();