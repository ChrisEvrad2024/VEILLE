// src/services/db.service.ts

import { dbConnectionManager } from './db-connection-manager';

/**
 * Service pour gérer les opérations de base de données avec IndexedDB
 */

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
        name: 'cmsRevisions',
        keyPath: 'id',
        indexes: [
            { name: 'pageId', keyPath: 'pageId', options: { unique: false } },
            { name: 'revisionNumber', keyPath: 'revisionNumber', options: { unique: false } }
        ]
    },
    {
        name: 'cmsComponents',
        keyPath: 'id',
        indexes: [
            { name: 'type', keyPath: 'type', options: { unique: false } },
            { name: 'isActive', keyPath: 'isActive', options: { unique: false } }
        ]
    },
    {
        name: 'cmsTemplates',
        keyPath: 'id',
        indexes: [
            { name: 'isActive', keyPath: 'isActive', options: { unique: false } }
        ]
    },
    {
        name: 'cmsMedia',
        keyPath: 'id',
        indexes: [
            { name: 'type', keyPath: 'type', options: { unique: false } }
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
        keyPath: 'code', // Le keyPath reste 'code'
        indexes: [
            { name: 'id', keyPath: 'id', options: { unique: true } },
            { name: 'code', keyPath: 'code', options: { unique: true } },
            { name: 'isActive', keyPath: 'isActive', options: { unique: false } },
            { name: 'type', keyPath: 'type', options: { unique: false } }
        ]
    },
    {
        name: 'images',
        keyPath: 'id',
        indexes: [
            { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
            { name: 'type', keyPath: 'type', options: { unique: false } },
            { name: 'filename', keyPath: 'filename', options: { unique: false } }
        ]
    }
];

/**
 * Initialize the database
 */
const initDatabase = async (): Promise<void> => {
    // Configure the connection manager with our stores
    dbConnectionManager.configure(STORES_CONFIG);
    
    // Initialize the connection
    await dbConnectionManager.initialize();
};

/**
 * Delete the database
 */
const deleteDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        dbConnectionManager.closeConnection();
        
        const request = indexedDB.deleteDatabase('chezFlora');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log("Database deleted successfully");
            resolve();
        };
    });
};

/**
 * Ensure database is initialized
 */
const ensureDatabaseInitialized = async (): Promise<void> => {
    await initDatabase();
};

/**
 * Add an item to the database
 */
const addItem = async <T extends { id?: string | number }>(storeName: string, item: T): Promise<T> => {
    return dbConnectionManager.execute(storeName, 'readwrite', async (store) => {
        return new Promise((resolve, reject) => {
            const request = store.add(item);
            
            request.onsuccess = () => {
                resolve(item);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
};

/**
 * Update an item in the database
 */
const updateItem = async <T extends { id: string | number }>(storeName: string, item: T): Promise<T> => {
    return dbConnectionManager.execute(storeName, 'readwrite', async (store) => {
        return new Promise((resolve, reject) => {
            const request = store.put(item);
            
            request.onsuccess = () => {
                resolve(item);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
};

/**
 * Get an item by ID
 */
const getItemById = async <T>(storeName: string, id: string | number): Promise<T | null> => {
    return dbConnectionManager.execute(storeName, 'readonly', async (store) => {
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
};

/**
 * Alias for getItemById
 */
const get = getItemById;

/**
 * Delete an item from the database
 */
const deleteItem = async (storeName: string, id: string | number): Promise<boolean> => {
    try {
        await dbConnectionManager.execute(storeName, 'readwrite', async (store) => {
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        });
        return true;
    } catch (error) {
        console.error(`Error deleting item from ${storeName}:`, error);
        return false;
    }
};

/**
 * Get all items from a store
 */
const getAllItems = async <T>(storeName: string, options: QueryOptions = {}): Promise<T[]> => {
    return dbConnectionManager.execute(storeName, 'readonly', async (store) => {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            
            request.onsuccess = () => {
                let result = request.result;
                
                // Apply pagination if options are provided
                if (options.offset !== undefined || options.limit !== undefined) {
                    const offset = options.offset || 0;
                    const limit = options.limit || result.length;
                    result = result.slice(offset, offset + limit);
                }
                
                resolve(result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
};

/**
 * Alias for getAllItems
 */
const getAll = getAllItems;

/**
 * Get items by status
 */
const getByStatus = async <T>(storeName: string, status: string): Promise<T[]> => {
    return getByIndex(storeName, 'status', status);
};

/**
 * Get items by user ID
 */
const getByUserId = async <T>(storeName: string, userId: string): Promise<T[]> => {
    return getByIndex(storeName, 'userId', userId);
};

/**
 * Get items by index
 */
const getByIndex = async <T>(
    storeName: string,
    indexName: string,
    value: any,
    options: QueryOptions = {}
): Promise<T[]> => {
    return dbConnectionManager.execute(storeName, 'readonly', async (store) => {
        return new Promise((resolve, reject) => {
            if (!store.indexNames.contains(indexName)) {
                reject(new Error(`Index '${indexName}' does not exist on store '${storeName}'`));
                return;
            }
            
            const index = store.index(indexName);
            
            // For boolean values, we need to filter manually
            if (typeof value === 'boolean') {
                const allRequest = store.getAll();
                
                allRequest.onsuccess = () => {
                    const result = allRequest.result.filter(item => item[indexName] === value);
                    
                    // Apply pagination if options are provided
                    if (options.offset !== undefined || options.limit !== undefined) {
                        const offset = options.offset || 0;
                        const limit = options.limit || result.length;
                        resolve(result.slice(offset, offset + limit));
                    } else {
                        resolve(result);
                    }
                };
                
                allRequest.onerror = () => {
                    reject(allRequest.error);
                };
            } else {
                // For other values, use the index directly
                const request = index.getAll(value);
                
                request.onsuccess = () => {
                    let result = request.result;
                    
                    // Apply pagination if options are provided
                    if (options.offset !== undefined || options.limit !== undefined) {
                        const offset = options.offset || 0;
                        const limit = options.limit || result.length;
                        result = result.slice(offset, offset + limit);
                    }
                    
                    resolve(result);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            }
        });
    });
};

/**
 * Get one item by index
 */
const getOneByIndex = async <T>(
    storeName: string,
    indexName: string,
    value: any
): Promise<T | null> => {
    return dbConnectionManager.execute(storeName, 'readonly', async (store) => {
        return new Promise((resolve, reject) => {
            if (!store.indexNames.contains(indexName)) {
                reject(new Error(`Index '${indexName}' does not exist on store '${storeName}'`));
                return;
            }
            
            const index = store.index(indexName);
            const request = index.get(value);
            
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
};

/**
 * Search for items by field
 */
const searchByField = async <T>(
    storeName: string,
    field: string,
    searchTerm: string,
    options: QueryOptions = {}
): Promise<T[]> => {
    try {
        const allItems = await getAllItems<T>(storeName);
        
        // Filter items that match the search term
        const searchResults = allItems.filter(item => {
            const fieldValue = (item as any)[field];
            
            if (typeof fieldValue === 'string') {
                return fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
            }
            
            return false;
        });
        
        // Apply pagination if options are provided
        if (options.offset !== undefined || options.limit !== undefined) {
            const offset = options.offset || 0;
            const limit = options.limit || searchResults.length;
            return searchResults.slice(offset, offset + limit);
        } else {
            return searchResults;
        }
    } catch (error) {
        console.error(`Error in searchByField for ${storeName}:`, error);
        throw error;
    }
};

/**
 * Clear a store
 */
const clearStore = async (storeName: string): Promise<boolean> => {
    try {
        await dbConnectionManager.execute(storeName, 'readwrite', async (store) => {
            return new Promise((resolve, reject) => {
                const request = store.clear();
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        });
        return true;
    } catch (error) {
        console.error(`Error clearing store ${storeName}:`, error);
        return false;
    }
};

/**
 * Check if an item exists
 */
const itemExists = async (storeName: string, id: string | number): Promise<boolean> => {
    const item = await getItemById(storeName, id);
    return item !== null;
};

/**
 * Count items in a store
 */
const countItems = async (storeName: string): Promise<number> => {
    return dbConnectionManager.execute(storeName, 'readonly', async (store) => {
        return new Promise((resolve, reject) => {
            const request = store.count();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
};

/**
 * Check if a store exists
 */
const storeExists = async (storeName: string): Promise<boolean> => {
    try {
        const db = await dbConnectionManager.getConnection();
        return db.objectStoreNames.contains(storeName);
    } catch (error) {
        console.error(`Error checking if store ${storeName} exists:`, error);
        return false;
    }
};

/**
 * Get active promo codes
 */
const getActivePromoCodes = async <T>(): Promise<T[]> => {
    try {
        return await getByIndex<T>('promoCodes', 'isActive', true);
    } catch (error) {
        console.error('Error getting active promo codes:', error);
        return [];
    }
};

// Initialize the database on module load
initDatabase().catch(error => {
    console.error("Error initializing database on startup:", error);
});

/**
 * Export the database service
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