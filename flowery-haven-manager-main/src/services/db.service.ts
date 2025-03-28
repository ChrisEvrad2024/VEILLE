// src/services/db.service.ts
const DB_NAME = "chezFlora";
// Augmenter la version pour déclencher la mise à jour de la structure
const DB_VERSION = 2;

// Fonction utilitaire pour supprimer la base de données (en développement)
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

// Initialiser la base de données et créer les object stores
const initDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Database error:", request.error);
            reject(request.error);
        };
        
        request.onsuccess = (event) => {
            console.log("Database opened successfully");
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            console.log(`Database upgrade needed. Old version: ${event.oldVersion}, New version: ${DB_VERSION}`);
            const db = request.result;

            // Créer les object stores avec leurs index
            if (!db.objectStoreNames.contains("users")) {
                console.log("Creating users store");
                const usersStore = db.createObjectStore("users", { keyPath: "id" });
                usersStore.createIndex("email", "email", { unique: true });
                usersStore.createIndex("role", "role", { unique: false });
            }

            if (!db.objectStoreNames.contains("products")) {
                console.log("Creating products store");
                const productsStore = db.createObjectStore("products", { keyPath: "id" });
                productsStore.createIndex("category", "category", { unique: false });
                productsStore.createIndex("popular", "popular", { unique: false });
            }

            if (!db.objectStoreNames.contains("categories")) {
                console.log("Creating categories store");
                db.createObjectStore("categories", { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains("cart")) {
                console.log("Creating cart store");
                const cartStore = db.createObjectStore("cart", { keyPath: "id", autoIncrement: true });
                cartStore.createIndex("userId", "userId", { unique: false });
                cartStore.createIndex("productId", "productId", { unique: false });
            }

            if (!db.objectStoreNames.contains("wishlist")) {
                console.log("Creating wishlist store");
                const wishlistStore = db.createObjectStore("wishlist", { keyPath: "id", autoIncrement: true });
                wishlistStore.createIndex("userId", "userId", { unique: false });
                wishlistStore.createIndex("productId", "productId", { unique: false });
            }

            if (!db.objectStoreNames.contains("orders")) {
                console.log("Creating orders store");
                const ordersStore = db.createObjectStore("orders", { keyPath: "id" });
                ordersStore.createIndex("userId", "userId", { unique: false });
                ordersStore.createIndex("status", "status", { unique: false });
            }

            if (!db.objectStoreNames.contains("addresses")) {
                console.log("Creating addresses store");
                const addressesStore = db.createObjectStore("addresses", { keyPath: "id" });
                addressesStore.createIndex("userId", "userId", { unique: false });
                addressesStore.createIndex("type", "type", { unique: false });
            }

            if (!db.objectStoreNames.contains("blog")) {
                console.log("Creating blog store");
                const blogStore = db.createObjectStore("blog", { keyPath: "id" });
                blogStore.createIndex("category", "category", { unique: false });
                blogStore.createIndex("featured", "featured", { unique: false });
            }

            if (!db.objectStoreNames.contains("blogComments")) {
                console.log("Creating blogComments store");
                const commentsStore = db.createObjectStore("blogComments", { keyPath: "id", autoIncrement: true });
                commentsStore.createIndex("postId", "postId", { unique: false });
            }

            // Nouvelles tables ajoutées pour les fonctionnalités avancées
            if (!db.objectStoreNames.contains("userRoles")) {
                console.log("Creating userRoles store");
                const userRolesStore = db.createObjectStore("userRoles", { keyPath: "id" });
                userRolesStore.createIndex("name", "name", { unique: true });
            }

            if (!db.objectStoreNames.contains("adminActions")) {
                console.log("Creating adminActions store");
                const adminActionsStore = db.createObjectStore("adminActions", { keyPath: "id" });
                adminActionsStore.createIndex("adminId", "adminId", { unique: false });
                adminActionsStore.createIndex("timestamp", "timestamp", { unique: false });
            }

            if (!db.objectStoreNames.contains("loginHistory")) {
                console.log("Creating loginHistory store");
                const loginHistoryStore = db.createObjectStore("loginHistory", { keyPath: "id" });
                loginHistoryStore.createIndex("userId", "userId", { unique: false });
                loginHistoryStore.createIndex("timestamp", "timestamp", { unique: false });
            }
            
            console.log("Database upgrade completed");
        };
    });
};

// Fonction pour s'assurer que la base de données est correctement initialisée avant utilisation
const ensureDatabaseInitialized = async (): Promise<IDBDatabase> => {
    try {
        return await initDatabase();
    } catch (error) {
        console.error("Error initializing database, attempting to reset:", error);
        try {
            // En cas d'erreur grave, tenter de supprimer et recréer la base de données
            await deleteDatabase();
            return await initDatabase();
        } catch (resetError) {
            console.error("Failed to reset database:", resetError);
            throw resetError;
        }
    }
};

// Initializer le DB et renvoyer une référence utilisable
const initDB = async (): Promise<IDBDatabase> => {
    try {
        return await ensureDatabaseInitialized();
    } catch (error) {
        console.error("Error in initDB:", error);
        throw error;
    }
};

// Ajouter un élément à un store
const addItem = <T>(storeName: string, item: T): Promise<T> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            const addRequest = store.add(item);

            addRequest.onsuccess = () => resolve(item);
            addRequest.onerror = () => {
                console.error(`Error adding item to ${storeName}:`, addRequest.error);
                reject(addRequest.error);
            };

            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, tx.error);
                reject(tx.error);
            };
        } catch (error) {
            console.error(`Error in addItem for ${storeName}:`, error);
            reject(error);
        }
    });
};

// Obtenir tous les éléments d'un store
const getAllItems = <T>(storeName: string): Promise<T[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => {
                console.error(`Error getting all items from ${storeName}:`, getAllRequest.error);
                reject(getAllRequest.error);
            };

            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, tx.error);
                reject(tx.error);
            };
        } catch (error) {
            console.error(`Error in getAllItems for ${storeName}:`, error);
            reject(error);
        }
    });
};

// Obtenir un élément par son ID
const getItemById = <T>(storeName: string, id: string | number): Promise<T | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const getRequest = store.get(id);

            getRequest.onsuccess = () => resolve(getRequest.result || null);
            getRequest.onerror = () => {
                console.error(`Error getting item by id from ${storeName}:`, getRequest.error);
                reject(getRequest.error);
            };

            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, tx.error);
                reject(tx.error);
            };
        } catch (error) {
            console.error(`Error in getItemById for ${storeName}:`, error);
            reject(error);
        }
    });
};

// Mettre à jour un élément
const updateItem = <T>(storeName: string, item: T): Promise<T> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            const putRequest = store.put(item);

            putRequest.onsuccess = () => resolve(item);
            putRequest.onerror = () => {
                console.error(`Error updating item in ${storeName}:`, putRequest.error);
                reject(putRequest.error);
            };

            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, tx.error);
                reject(tx.error);
            };
        } catch (error) {
            console.error(`Error in updateItem for ${storeName}:`, error);
            reject(error);
        }
    });
};

// Supprimer un élément
const deleteItem = (storeName: string, id: string | number): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            const deleteRequest = store.delete(id);

            deleteRequest.onsuccess = () => resolve(true);
            deleteRequest.onerror = () => {
                console.error(`Error deleting item from ${storeName}:`, deleteRequest.error);
                reject(deleteRequest.error);
            };

            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, tx.error);
                reject(tx.error);
            };
        } catch (error) {
            console.error(`Error in deleteItem for ${storeName}:`, error);
            reject(error);
        }
    });
};

// Rechercher des éléments par un index
const getByIndex = <T>(storeName: string, indexName: string, value: any): Promise<T[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);

            const getRequest = index.getAll(value);

            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => {
                console.error(`Error getting items by index from ${storeName}:`, getRequest.error);
                reject(getRequest.error);
            };

            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, tx.error);
                reject(tx.error);
            };
        } catch (error) {
            console.error(`Error in getByIndex for ${storeName}:`, error);
            reject(error);
        }
    });
};

// Effacer tous les éléments d'un store
const clearStore = (storeName: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            const clearRequest = store.clear();

            clearRequest.onsuccess = () => resolve(true);
            clearRequest.onerror = () => {
                console.error(`Error clearing store ${storeName}:`, clearRequest.error);
                reject(clearRequest.error);
            };

            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, tx.error);
                reject(tx.error);
            };
        } catch (error) {
            console.error(`Error in clearStore for ${storeName}:`, error);
            reject(error);
        }
    });
};

// Compter le nombre d'éléments dans un store
const countItems = (storeName: string): Promise<number> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const countRequest = store.count();

            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => {
                console.error(`Error counting items in ${storeName}:`, countRequest.error);
                reject(countRequest.error);
            };

            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, tx.error);
                reject(tx.error);
            };
        } catch (error) {
            console.error(`Error in countItems for ${storeName}:`, error);
            reject(error);
        }
    });
};

// Obtenir un seul élément par un index (renvoie le premier trouvé)
const getOneByIndex = <T>(storeName: string, indexName: string, value: any): Promise<T | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await ensureDatabaseInitialized();
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);

            const getRequest = index.get(value);

            getRequest.onsuccess = () => resolve(getRequest.result || null);
            getRequest.onerror = () => {
                console.error(`Error getting item by index from ${storeName}:`, getRequest.error);
                reject(getRequest.error);
            };

            tx.oncomplete = () => db.close();
            tx.onerror = () => {
                console.error(`Transaction error for ${storeName}:`, tx.error);
                reject(tx.error);
            };
        } catch (error) {
            console.error(`Error in getOneByIndex for ${storeName}:`, error);
            reject(error);
        }
    });
};

// Vérifier si un object store existe
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

export const dbService = {
    initDatabase,
    deleteDatabase,
    ensureDatabaseInitialized,
    initDB,
    addItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem,
    getByIndex,
    getOneByIndex,
    clearStore,
    countItems,
    storeExists
};