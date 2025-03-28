// src/services/db.service.ts
const DB_NAME = "chezFlora";
const DB_VERSION = 1;

// Initialiser la base de données et créer les object stores
const initDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = request.result;

            // Créer les object stores avec leurs index
            if (!db.objectStoreNames.contains("users")) {
                const usersStore = db.createObjectStore("users", { keyPath: "id" });
                usersStore.createIndex("email", "email", { unique: true });
                usersStore.createIndex("role", "role", { unique: false });
            }

            if (!db.objectStoreNames.contains("products")) {
                const productsStore = db.createObjectStore("products", { keyPath: "id" });
                productsStore.createIndex("category", "category", { unique: false });
                productsStore.createIndex("popular", "popular", { unique: false });
            }

            if (!db.objectStoreNames.contains("categories")) {
                db.createObjectStore("categories", { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains("cart")) {
                const cartStore = db.createObjectStore("cart", { keyPath: "id", autoIncrement: true });
                cartStore.createIndex("userId", "userId", { unique: false });
                cartStore.createIndex("productId", "productId", { unique: false });
            }

            if (!db.objectStoreNames.contains("wishlist")) {
                const wishlistStore = db.createObjectStore("wishlist", { keyPath: "id", autoIncrement: true });
                wishlistStore.createIndex("userId", "userId", { unique: false });
                wishlistStore.createIndex("productId", "productId", { unique: false });
            }

            if (!db.objectStoreNames.contains("orders")) {
                const ordersStore = db.createObjectStore("orders", { keyPath: "id" });
                ordersStore.createIndex("userId", "userId", { unique: false });
                ordersStore.createIndex("status", "status", { unique: false });
            }

            if (!db.objectStoreNames.contains("addresses")) {
                const addressesStore = db.createObjectStore("addresses", { keyPath: "id" });
                addressesStore.createIndex("userId", "userId", { unique: false });
                addressesStore.createIndex("type", "type", { unique: false });
            }

            if (!db.objectStoreNames.contains("blog")) {
                const blogStore = db.createObjectStore("blog", { keyPath: "id" });
                blogStore.createIndex("category", "category", { unique: false });
                blogStore.createIndex("featured", "featured", { unique: false });
            }

            if (!db.objectStoreNames.contains("blogComments")) {
                const commentsStore = db.createObjectStore("blogComments", { keyPath: "id", autoIncrement: true });
                commentsStore.createIndex("postId", "postId", { unique: false });
            }
        };
    });
};

// Ajouter un élément à un store
const addItem = <T>(storeName: string, item: T): Promise<T> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            const addRequest = store.add(item);

            addRequest.onsuccess = () => resolve(item);
            addRequest.onerror = () => reject(addRequest.error);

            tx.oncomplete = () => db.close();
        };

        request.onerror = () => reject(request.error);
    });
};

// Obtenir tous les éléments d'un store
const getAllItems = <T>(storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);

            tx.oncomplete = () => db.close();
        };

        request.onerror = () => reject(request.error);
    });
};

// Obtenir un élément par son ID
const getItemById = <T>(storeName: string, id: string | number): Promise<T | null> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            const getRequest = store.get(id);

            getRequest.onsuccess = () => resolve(getRequest.result || null);
            getRequest.onerror = () => reject(getRequest.error);

            tx.oncomplete = () => db.close();
        };

        request.onerror = () => reject(request.error);
    });
};

// Mettre à jour un élément
const updateItem = <T>(storeName: string, item: T): Promise<T> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            const putRequest = store.put(item);

            putRequest.onsuccess = () => resolve(item);
            putRequest.onerror = () => reject(putRequest.error);

            tx.oncomplete = () => db.close();
        };

        request.onerror = () => reject(request.error);
    });
};

// Supprimer un élément
const deleteItem = (storeName: string, id: string | number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            const deleteRequest = store.delete(id);

            deleteRequest.onsuccess = () => resolve(true);
            deleteRequest.onerror = () => reject(deleteRequest.error);

            tx.oncomplete = () => db.close();
        };

        request.onerror = () => reject(request.error);
    });
};

// Rechercher des éléments par un index
const getByIndex = <T>(storeName: string, indexName: string, value: any): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);

            const getRequest = index.getAll(value);

            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);

            tx.oncomplete = () => db.close();
        };

        request.onerror = () => reject(request.error);
    });
};

// Effacer tous les éléments d'un store
const clearStore = (storeName: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);

        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            const clearRequest = store.clear();

            clearRequest.onsuccess = () => resolve(true);
            clearRequest.onerror = () => reject(clearRequest.error);

            tx.oncomplete = () => db.close();
        };

        request.onerror = () => reject(request.error);
    });
};

export const dbService = {
    initDatabase,
    addItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem,
    getByIndex,
    clearStore
};