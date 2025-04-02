// src/components/AppInitializer.tsx
import React, { useEffect, useState } from 'react';
import { initService } from '@/services/init.service';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initService.initializeApplication();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize application:', err);
        setError('Une erreur est survenue lors de l\'initialisation de l\'application. Veuillez rafraîchir la page.');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="p-6 max-w-md bg-white rounded-lg shadow-lg">
          <div className="mb-4 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-4 text-center">Erreur d'initialisation</h1>
          <p className="text-gray-700 mb-4 text-center">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="p-6 max-w-md bg-white rounded-lg shadow-lg text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <h1 className="text-xl font-medium mb-2 text-gray-800">Initialisation en cours...</h1>
          <p className="text-gray-500">Veuillez patienter pendant la préparation de l'application.</p>
        </div>
      </div>
    );
  }

  // Once initialized, render the children
  return <>{children}</>;
};

export default AppInitializer;