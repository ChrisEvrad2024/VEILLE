// src/utils/dbUpgrade.ts

/**
 * Utilitaire pour mettre à jour la structure de la base de données
 * sans perdre les données existantes
 */

// Cette fonction met à jour la base de données pour ajouter le store 'images'
export function upgradeDatabase() {
    return new Promise<void>((resolve, reject) => {
        // Ouvrir une connexion à la base de données existante
        const dbName = 'chezFlora';
        const request = indexedDB.open(dbName);
        
        request.onerror = (event) => {
            console.error('Erreur lors de l\'ouverture de la base de données:', event);
            reject(new Error('Impossible d\'ouvrir la base de données'));
        };
        
        // Obtenir la version actuelle pour la mise à jour
        request.onsuccess = (event) => {
            const db = request.result;
            const currentVersion = db.version;
            db.close();
            
            // Rouvrir avec une version incrémentée pour déclencher la mise à niveau
            const upgradeRequest = indexedDB.open(dbName, currentVersion + 1);
            
            upgradeRequest.onupgradeneeded = (event) => {
                const db = upgradeRequest.result;
                
                // Vérifier si le store existe déjà
                if (!db.objectStoreNames.contains('images')) {
                    console.log('Création du store images...');
                    // Créer le nouveau store
                    const imageStore = db.createObjectStore('images', { keyPath: 'id' });
                    
                    // Ajouter les index
                    imageStore.createIndex('createdAt', 'createdAt', { unique: false });
                    imageStore.createIndex('type', 'type', { unique: false });
                    imageStore.createIndex('filename', 'filename', { unique: false });
                    
                    console.log('Store images créé avec succès');
                }
            };
            
            upgradeRequest.onsuccess = () => {
                console.log('Base de données mise à jour avec succès');
                upgradeRequest.result.close();
                resolve();
            };
            
            upgradeRequest.onerror = (event) => {
                console.error('Erreur lors de la mise à jour de la base de données:', event);
                reject(new Error('Impossible de mettre à jour la base de données'));
            };
        };
    });
}

// Pour utiliser cette fonction, appelez-la au démarrage de l'application:
// import { upgradeDatabase } from '@/utils/dbUpgrade';
// 
// useEffect(() => {
//   upgradeDatabase()
//     .then(() => console.log('Base de données mise à jour'))
//     .catch(err => console.error('Erreur de mise à jour:', err));
// }, []);