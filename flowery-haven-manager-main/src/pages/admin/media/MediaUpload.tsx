import React, { useState } from 'react';
import { mediaService } from '../../../services/MediaService';
import { useNavigate } from 'react-router-dom';

export default function MediaUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      const total = selectedFiles.length;
      let completed = 0;
      
      for (const file of selectedFiles) {
        // Vérification du type de fichier
        if (!file.type.startsWith('image/')) {
          setError(`Le fichier ${file.name} n'est pas une image`);
          continue;
        }
        
        await mediaService.uploadMedia(file);
        completed++;
        setProgress(Math.round((completed / total) * 100));
      }
      
      // Rediriger vers la bibliothèque de médias
      navigate('/admin/media');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Upload de médias</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          id="fileInput"
          onChange={handleFileSelect}
        />
        <label
          htmlFor="fileInput"
          className="cursor-pointer block mb-4"
        >
          <div className="flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <span className="text-gray-600">Cliquez pour sélectionner des images</span>
            <span className="text-sm text-gray-500">ou glissez-déposez les fichiers ici</span>
          </div>
        </label>
        
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-600">{selectedFiles.length} fichier(s) sélectionné(s)</div>
            <ul className="mt-2 text-left">
              {selectedFiles.map((file, index) => (
                <li key={index} className="text-sm text-gray-600">{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {uploading && (
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-center mt-2">{progress}%</div>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/admin/media')}
          className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-sm"
        >
          Annuler
        </button>
        <button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:bg-gray-400"
        >
          {uploading ? 'Upload en cours...' : 'Uploader'}
        </button>
      </div>
    </div>
  );
}