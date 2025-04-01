// src/services/db.service.ts

/**
 * Service pour gérer les opérations de base de données avec IndexedDB
 * Combine les fonctionnalités des deux implémentations précédentes
 */

// Configuration de la base de données
const DB_NAME = 'chezFlora';
// Set a higher initial version to prevent conflicts
const DB_VERSION = 3;

// Interface pour les options de requête
interface QueryOptions {
    limit?: number;
    offset?: number;
    direction?: IDBCursorDirection;
}

// Configuration des object stores et indexes
const STORES_CONFIG = [
    {
        name: 'products',
        keyPath: 'id',
        indexes: [
            { name: 'category', keyPath: 'category', options: { unique: false } },
            { name: 'popular', keyPath: 'popular', options: { unique: false } },
            { name: 'featured', keyPath: 'featured', options: { unique: false } },
            { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } }
        ]
    },
    {
        name: 'media',
        keyPath: 'id',
        indexes: [
            { name: 'createdBy', keyPath: 'createdBy', options: { unique: false } },
            { name: 'type', keyPath: 'type', options: { unique: false } },
            { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } }
        ]
    },
    {
        name: 'categories',
        keyPath: 'id',
        indexes: [
            { name: 'parentId', keyPath: 'parentId', options: { unique: false } },
            { name: 'order', keyPath: 'order', options: { unique: false } }
        ]
    },
    {
        name: 'cart',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'userId', keyPath: 'userId', options: { unique: false } },
            { name: 'productId', keyPath: 'productId', options: { unique: false } }
        ]
    },
    {
        name: 'wishlist',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'userId', keyPath: 'userId', options: { unique: false } },
            { name: 'productId', keyPath: 'productId', options: { unique: false } }
        ]
    },
    {
        name: 'orders',
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId', options: { unique: false } },
            { name: 'status', keyPath: 'status', options: { unique: false } },
            { name: 'date', keyPath: 'date', options: { unique: false } }
        ]
    },
    {
        name: 'users',
        keyPath: 'id',
        indexes: [
            { name: 'email', keyPath: 'email', options: { unique: true } },
            { name: 'role', keyPath: 'role', options: { unique: false } }
        ]
    },
    {
        name: 'addresses',
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId', options: { unique: false } },
            { name: 'type', keyPath: 'type', options: { unique: false } }
        ]
    },
    {
        name: 'blog',
        keyPath: 'id',
        indexes: [
            { name: 'category', keyPath: 'category', options: { unique: false } },
            { name: 'date', keyPath: 'date', options: { unique: false } },
            { name: 'featured', keyPath: 'featured', options: { unique: false } }
        ]
    },
    {
        name: 'blogComments',
        keyPath: 'id',
        autoIncrement: true,
        indexes: [
            { name: 'postId', keyPath: 'postId', options: { unique: false } },
            { name: 'parentId', keyPath: 'parentId', options: { unique: false } }
        ]
    },
    {
        name: 'paymentMethods',
        keyPath: 'id',
        indexes: [
            { name: 'isActive', keyPath: 'isActive', options: { unique: false } },
            { name: 'position', keyPath: 'position', options: { unique: false } }
        ]
    },
    {
        name: 'cmsPages',
        keyPath: 'id',
        indexes: [
            { name: 'slug', keyPath: 'slug', options: { unique: true } },
            { name: 'type', keyPath: 'type', options: { unique: false } },
            { name: 'published', keyPath: 'published', options: { unique: false } }
        ]
    },
    {
        name: 'userRoles',
        keyPath: 'id',
        indexes: [
            { name: 'name', keyPath: 'name', options: { unique: true } }
        ]
    },
    {
        name: 'adminActions',
        keyPath: 'id',
        indexes: [
            { name: 'adminId', keyPath: 'adminId', options: { unique: false } },
            { name: 'timestamp', keyPath: 'timestamp', options: { unique: false } }
        ]
    },
    {
        name: 'loginHistory',
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId', options: { unique: false } },
            { name: 'timestamp', keyPath: 'timestamp', options: { unique: false } }
        ]
    },
    // Add quotes store configuration
    {
        name: 'quotes',
        keyPath: 'id',
        indexes: [
            { name: 'userId', keyPath: 'userId', options: { unique: false } },
            { name: 'status', keyPath: 'status', options: { unique: false } },
            { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
            { name: 'eventType', keyPath: 'eventType', options: { unique: false } },
            { name: 'expiresAt', keyPath: 'expiresAt', options: { unique: false } },
            { name: 'requestId', keyPath: 'requestId', options: { unique: false } }
        ]
    },
    // Add promoCodes store configuration
    {
        name: 'promoCodes',
        keyPath: 'code',
        indexes: [
            { name: 'isActive', keyPath: 'isActive', options: { unique: false } },
            { name: 'type', keyPath: 'type', options: { unique: false } },
            { name: 'expiryDate', keyPath: 'expiryDate', options: { unique: false } }
        ]
    }
];

/**
 * Function to get current database version
 */
const getCurrentDbVersion = (): Promise<number | null> => {
    return new Promise((resolve) => {
        // Open the database without specifying version
        const request = indexedDB.open(DB_NAME);
        
        request.onsuccess = () => {
            const version = request.result.version;
            request.result.close();
            resolve(version);
        };
        
        request.onerror = () => {
            // If there's an error, resolve with null - indicates no existing database
            resolve(null);
        };
    });
};

/**
 * Fonction utilitaire pour supprimer la base de données (en développement)
 */
const deleteDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log("Database deleted successfully");
            resolve();
        };
    });
};

const checkStoresExist = (db: IDBDatabase): boolean => {
    const requiredStores = STORES_CONFIG.map(store => store.name);
    for (const storeName of requiredStores) {
        if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`Missing object store: ${storeName}`);
            return false;
        }
    }
    return true;
};

/**
 * Initialiser la base de données
 */
// Ajoutons un compteur de tentatives global pour éviter la récursion infinie
let initAttempt = 0;
const MAX_INIT_ATTEMPTS = 2;

// Constante globale pour éviter de hardcoder la version partout
let CURRENT_DB_VERSION = DB_VERSION;

/**
 * Check if database exists with a version and reset if needed
 */
const checkAndResetIfNeeded = async (): Promise<void> => {
    try {
        // Get the current version of the database
        const currentVersion = await getCurrentDbVersion();
        
        if (currentVersion !== null) {
            // Database exists, adjust our version to be higher
            CURRENT_DB_VERSION = Math.max(CURRENT_DB_VERSION, currentVersion);
            
            // If you're in development and want to force a reset
            const forceReset = false; // Set to true to force database rebuild
            
            if (forceReset) {
                console.log("Forcing database reset...");
                await deleteDatabase();
                CURRENT_DB_VERSION = DB_VERSION; // Reset to base version
            }
        }
    } catch (error) {
        console.error("Error checking database version:", error);
    }
};

/**
 * Initialiser la base de données avec une approche non récursive
 */
const initDatabase = async (): Promise<IDBDatabase> => {
    // First check if we need to adjust the version
    await checkAndResetIfNeeded();
    
    return new Promise((resolve, reject) => {
        console.log(`Opening database with version ${CURRENT_DB_VERSION}`);
        const request = indexedDB.open(DB_NAME, CURRENT_DB_VERSION);
        
        request.onerror = (event) => {
            console.error("Database error:", request.error);
            
            // If error is about version being too low, try to recover
            if (request.error && request.error.name === 'VersionError') {
                // Try to delete and recreate
                deleteDatabase().then(() => {
                    // Try again with a higher version
                    CURRENT_DB_VERSION += 1;
                    const newRequest = indexedDB.open(DB_NAME, CURRENT_DB_VERSION);
                    
                    newRequest.onupgradeneeded = (e) => {
                        console.log(`Performing upgrade to version ${CURRENT_DB_VERSION} after reset`);
                        createStores(newRequest.result);
                    };
                    
                    newRequest.onsuccess = () => {
                        console.log(`Database successfully reopened with version ${CURRENT_DB_VERSION}`);
                        resolve(newRequest.result);
                    };
                    
                    newRequest.onerror = () => {
                        console.error("Failed to recreate database:", newRequest.error);
                        reject(newRequest.error);
                    };
                }).catch(reject);
            } else {
                reject(request.error);
            }
        };
        
        request.onsuccess = (event) => {
            console.log(`Database opened successfully with version ${CURRENT_DB_VERSION}`);
            const db = request.result;
            
            // Vérifier si tous les stores existent
            if (checkStoresExist(db)) {
                resolve(db);
            } else {
                // Fermer la connexion et réessayer avec une version incrémentée
                db.close();
                
                console.warn("Missing stores detected, will try with increased version");
                
                // Incrémenter la version pour forcer une mise à niveau
                CURRENT_DB_VERSION++;
                
                if (CURRENT_DB_VERSION > DB_VERSION + 3) {
                    reject(new Error("Failed to create database schema after multiple version attempts"));
                    return;
                }
                
                // Supprimer la base et réessayer avec la nouvelle version
                deleteDatabase().then(() => {
                    console.log(`Deleted database, will reopen with version ${CURRENT_DB_VERSION}`);
                    
                    // Nouvel appel d'ouverture sans récursion
                    const newRequest = indexedDB.open(DB_NAME, CURRENT_DB_VERSION);
                    
                    newRequest.onerror = () => reject(newRequest.error);
                    
                    newRequest.onupgradeneeded = (e) => {
                        console.log(`Performing upgrade to version ${CURRENT_DB_VERSION}`);
                        createStores(newRequest.result);
                    };
                    
                    newRequest.onsuccess = () => {
                        console.log(`Database successfully opened with version ${CURRENT_DB_VERSION}`);
                        resolve(newRequest.result);
                    };
                }).catch(reject);
            }
        };
        
        request.onupgradeneeded = (event) => {
            console.log(`Database upgrade needed. Old version: ${event.oldVersion}, New version: ${CURRENT_DB_VERSION}`);
            createStores(request.result);
        };
    });
};

/**
 * Helper function to create stores
 */
const createStores = (db: IDBDatabase): void => {
    STORES_CONFIG.forEach(store => {
        if (!db.objectStoreNames.contains(store.name)) {
            console.log(`Creating ${store.name} store`);
            const storeOptions: IDBObjectStoreParameters = {
                keyPath: store.keyPath
            };
            
            if (store.autoIncrement) {
                storeOptions.autoIncrement = true;
            }
            
            const objectStore = db.createObjectStore(store.name, storeOptions);
            
            if (store.indexes) {
                store.indexes.forEach(index => {
                    objectStore.createIndex(index.name, index.keyPath, index.options);
                });
            }
        }
    });
    
    console.log("Database upgrade completed");
};

/**
 * Fonction simplifiée pour s'assurer que la base de données est correctement initialisée
 */
const ensureDatabaseInitialized = async (): Promise<IDBDatabase> => {
    try {
        return await initDatabase();
    } catch (error) {
        // Une seule tentative de récupération en cas d'erreur
        console.error("Error initializing database, attempting one reset:", error);
        await deleteDatabase();
        
        // Réinitialiser la version pour repartir de zéro
        CURRENT_DB_VERSION = DB_VERSION;
        return await initDatabase();
    }
};


/**
 * Exécuter une transaction sur un object store
 */
const executeTransaction = <T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            
            // Vérification supplémentaire que le store existe
            if (!db.objectStoreNames.contains(storeName)) {
                reject(new Error(`Object store '${storeName}' does not exist in the database`));
                db.close();
                return;
            }
            
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);

            const request = callback(store);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error(`Error in transaction for ${storeName}:`, request.error);
                reject(request.error);
            };

            // Fermer la connexion une fois la transaction terminée
            transaction.oncomplete = () => {
                db.close();
            };

            transaction.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, transaction.error);
                db.close();
                reject(transaction.error);
            };
        } catch (error) {
            console.error(`Error in executeTransaction for ${storeName}:`, error);
            reject(error);
        }
    });
};

/**
 * Ajouter un élément à un object store
 */
const addItem = async <T extends { id?: string | number }>(storeName: string, item: T): Promise<T> => {
    return executeTransaction<T>(storeName, 'readwrite', (store) => {
        return store.add(item);
    });
};

/**
 * Mettre à jour un élément dans un object store
 */
const updateItem = async <T extends { id: string | number }>(storeName: string, item: T): Promise<T> => {
    return executeTransaction<T>(storeName, 'readwrite', (store) => {
        return store.put(item);
    });
};

/**
 * Récupérer un élément par son ID
 */
const getItemById = async <T>(storeName: string, id: string | number): Promise<T | null> => {
    return executeTransaction<T>(storeName, 'readonly', (store) => {
        return store.get(id);
    });
};

/**
 * Alias pour getItemById pour maintenir la compatibilité avec le code existant
 */
const get = getItemById;

/**
 * Supprimer un élément par son ID
 */
const deleteItem = async (storeName: string, id: string | number): Promise<boolean> => {
    try {
        await executeTransaction<void>(storeName, 'readwrite', (store) => {
            return store.delete(id);
        });
        return true;
    } catch (error) {
        console.error(`Error deleting item from ${storeName}:`, error);
        return false;
    }
};

/**
 * Récupérer tous les éléments d'un object store
 */
const getAllItems = async <T>(storeName: string, options: QueryOptions = {}): Promise<T[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);

            const request = store.getAll();

            request.onsuccess = () => {
                let result = request.result;

                // Appliquer la pagination si des options sont fournies
                if (options.offset !== undefined || options.limit !== undefined) {
                    const offset = options.offset || 0;
                    const limit = options.limit || result.length;
                    result = result.slice(offset, offset + limit);
                }

                resolve(result);
            };

            request.onerror = () => {
                console.error(`Error getting all items from ${storeName}:`, request.error);
                reject(request.error);
            };

            transaction.oncomplete = () => {
                db.close();
            };

            transaction.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, transaction.error);
                db.close();
                reject(transaction.error);
            };
        } catch (error) {
            console.error(`Error in getAllItems for ${storeName}:`, error);
            reject(error);
        }
    });
};

/**
 * Alias pour getAllItems pour maintenir la compatibilité avec le code existant
 */
const getAll = getAllItems;

/**
 * Fonction pour récupérer les éléments par statut
 */
const getByStatus = async <T>(storeName: string, status: string): Promise<T[]> => {
    return getByIndex(storeName, 'status', status);
};

/**
 * Fonction pour récupérer les éléments par userId
 */
const getByUserId = async <T>(storeName: string, userId: string): Promise<T[]> => {
    return getByIndex(storeName, 'userId', userId);
};

/**
 * Récupérer des éléments par un index
 */
// Modifiez la fonction getByIndex dans db.service.ts pour mieux gérer les booléens:
const getByIndex = async <T>(
    storeName: string,
    indexName: string,
    value: any,
    options: QueryOptions = {}
): Promise<T[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);

            if (!store.indexNames.contains(indexName)) {
                reject(`Index '${indexName}' does not exist on store '${storeName}'`);
                return;
            }

            const index = store.index(indexName);
            
            // Si nous recherchons par valeur booléenne, nous utilisons une autre approche
            if (typeof value === 'boolean') {
                // Récupérer tous les éléments et filtrer manuellement
                const allRequest = store.getAll();
                
                allRequest.onsuccess = () => {
                    const result = allRequest.result.filter(item => item[indexName] === value);
                    
                    // Appliquer la pagination si des options sont fournies
                    if (options.offset !== undefined || options.limit !== undefined) {
                        const offset = options.offset || 0;
                        const limit = options.limit || result.length;
                        resolve(result.slice(offset, offset + limit));
                    } else {
                        resolve(result);
                    }
                };
                
                allRequest.onerror = () => {
                    console.error(`Error getting items by boolean index from ${storeName}:`, allRequest.error);
                    reject(allRequest.error);
                };
            } else {
                // Pour les autres types, utiliser getAll comme avant
                const request = index.getAll(value);

                request.onsuccess = () => {
                    let result = request.result;

                    // Appliquer la pagination si des options sont fournies
                    if (options.offset !== undefined || options.limit !== undefined) {
                        const offset = options.offset || 0;
                        const limit = options.limit || result.length;
                        result = result.slice(offset, offset + limit);
                    }

                    resolve(result);
                };

                request.onerror = () => {
                    console.error(`Error getting items by index from ${storeName}:`, request.error);
                    reject(request.error);
                };
            }

            transaction.oncomplete = () => {
                db.close();
            };

            transaction.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, transaction.error);
                db.close();
                reject(transaction.error);
            };
        } catch (error) {
            console.error(`Error in getByIndex for ${storeName}:`, error);
            reject(error);
        }
    });
};

/**
 * Obtenir un seul élément par un index (renvoie le premier trouvé)
 */
const getOneByIndex = async <T>(
    storeName: string,
    indexName: string,
    value: any
): Promise<T | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);

            if (!store.indexNames.contains(indexName)) {
                reject(`Index '${indexName}' does not exist on store '${storeName}'`);
                return;
            }

            const index = store.index(indexName);
            const request = index.get(value);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                console.error(`Error getting one item by index from ${storeName}:`, request.error);
                reject(request.error);
            };

            transaction.oncomplete = () => {
                db.close();
            };

            transaction.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, transaction.error);
                db.close();
                reject(transaction.error);
            };
        } catch (error) {
            console.error(`Error in getOneByIndex for ${storeName}:`, error);
            reject(error);
        }
    });
};

/**
 * Effectuer une recherche sur un champ spécifique
 */
const searchByField = async <T>(
    storeName: string,
    field: string,
    searchTerm: string,
    options: QueryOptions = {}
): Promise<T[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const allItems = await getAllItems<T>(storeName);

            // Filtrer les éléments qui correspondent au terme de recherche
            const searchResults = allItems.filter(item => {
                const fieldValue = (item as any)[field];

                if (typeof fieldValue === 'string') {
                    return fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
                }

                return false;
            });

            // Appliquer la pagination si des options sont fournies
            if (options.offset !== undefined || options.limit !== undefined) {
                const offset = options.offset || 0;
                const limit = options.limit || searchResults.length;
                resolve(searchResults.slice(offset, offset + limit));
            } else {
                resolve(searchResults);
            }
        } catch (error) {
            console.error(`Error in searchByField for ${storeName}:`, error);
            reject(error);
        }
    });
};

/**
 * Vider un object store
 */
const clearStore = async (storeName: string): Promise<boolean> => {
    try {
        await executeTransaction<void>(storeName, 'readwrite', (store) => {
            return store.clear();
        });
        return true;
    } catch (error) {
        console.error(`Error clearing store ${storeName}:`, error);
        return false;
    }
};

/**
 * Vérifier si un élément existe dans un store
 */
const itemExists = async (storeName: string, id: string | number): Promise<boolean> => {
    const item = await getItemById(storeName, id);
    return item !== null;
};

/**
 * Compter le nombre d'éléments dans un store
 */
const countItems = async (storeName: string): Promise<number> => {
    return executeTransaction<number>(storeName, 'readonly', (store) => {
        return store.count();
    });
};

/**
 * Vérifier si un object store existe
 */
const storeExists = async (storeName: string): Promise<boolean> => {
    try {
        const db = await initDatabase();
        const exists = db.objectStoreNames.contains(storeName);
        db.close();
        return exists;
    } catch (error) {
        console.error(`Error checking if store ${storeName} exists:`, error);
        return false;
    }
};

/**
 * Récupérer les codes promo actifs
 */
const getActivePromoCodes = async <T>(): Promise<T[]> => {
    try {
        return await getByIndex<T>('promoCodes', 'isActive', true);
    } catch (error) {
        console.error('Error getting active promo codes:', error);
        return [];
    }
};

/**
 * Exporter les fonctions du service
 */
export const dbService = {
    initDatabase,
    deleteDatabase,
    ensureDatabaseInitialized,
    addItem,
    updateItem,
    getItemById,
    get,
    deleteItem,
    getAllItems,
    getAll,
    getByIndex,
    getByStatus,
    getByUserId,
    getOneByIndex,
    searchByField,
    clearStore,
    itemExists,
    countItems,
    storeExists,
    getActivePromoCodes
};