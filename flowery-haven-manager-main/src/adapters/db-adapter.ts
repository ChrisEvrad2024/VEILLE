// src/services/db-adapter.ts
import { dbService as nativeDbService } from './db.service';

// Cet adaptateur traduit les appels de méthodes idb vers vos méthodes natives
export const dbAdapter = {
    add: <T>(storeName: string, data: T): Promise<T> =>
        nativeDbService.addItem(storeName, data),

    get: <T>(storeName: string, key: string): Promise<T | undefined> =>
        nativeDbService.getItemById<T>(storeName, key),

    put: <T>(storeName: string, data: T): Promise<T> =>
        nativeDbService.updateItem(storeName, data),

    getAll: <T>(storeName: string): Promise<T[]> =>
        nativeDbService.getAllItems<T>(storeName),

    clear: (storeName: string): Promise<void> =>
        nativeDbService.clearStore(storeName),

    // Méthodes pour les index spécifiques
    getByUserId: <T>(storeName: string, userId: string): Promise<T[]> =>
        nativeDbService.getByIndex<T>(storeName, 'userId', userId),

    getByStatus: <T>(storeName: string, status: string): Promise<T[]> =>
        nativeDbService.getByIndex<T>(storeName, 'status', status),

    getAllByIndex: <T>(storeName: string, indexName: string, value: any): Promise<T[]> =>
        nativeDbService.getByIndex<T>(storeName, indexName, value)
};