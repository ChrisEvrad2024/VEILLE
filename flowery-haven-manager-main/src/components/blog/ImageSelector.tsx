// src/components/admin/blog/ImageSelector.tsx
import React, { useState, useEffect } from 'react';
import { mediaService, MediaItem } from '@/services/media.service';

interface ImageSelectorProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function ImageSelector({ onSelect, onClose }: ImageSelectorProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadMedia() {
      try {
        setLoading(true);
        const items = await mediaService.getAllMedia();
        setMedia(items);
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des médias');
      } finally {
        setLoading(false);
      }
    }
    
    loadMedia();
  }, []);
  
  const handleSelect = (item: MediaItem) => {
    onSelect(item.dataUrl || item.url);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Sélectionner une image</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : media.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>Aucune image trouvée</p>
              <a href="/admin/media/upload" className="text-primary hover:underline">Uploader des images</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media.map(item => (
                <div 
                  key={item.id} 
                  className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSelect(item)}
                >
                  <div className="aspect-w-1 aspect-h-1 relative">
                    <img 
                      src={item.dataUrl || item.url}
                      alt={item.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-2 text-xs truncate">{item.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}