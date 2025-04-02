// src/services/db-connection-manager.ts

/**
 * Database Connection Manager
 * Provides a central manager for IndexedDB database connections,
 * with connection pooling, request queueing, and transaction coordination.
 */

// Configuration de la base de données
const DB_NAME = 'chezFlora';
const DB_VERSION = 14;

// Operation queue state
type OperationState = 'pending' | 'running' | 'completed' | 'failed';

// Operation in the queue
interface DbOperation {
  id: number;
  state: OperationState;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  retries: number;
}

class DbConnectionManager {
  private static instance: DbConnectionManager;
  private connection: IDBDatabase | null = null;
  private connectionPromise: Promise<IDBDatabase> | null = null;
  private operationQueue: DbOperation[] = [];
  private operationCounter = 0;
  private isProcessingQueue = false;
  private storesConfig: any[] = [];
  private maxRetries = 3;
  private initialized = false;
  private currentVersion = DB_VERSION;

  private constructor() {
    // Private constructor to enforce singleton
    console.log('Database Connection Manager created');
  }

  /**
   * Get the singleton instance of the connection manager
   */
  public static getInstance(): DbConnectionManager {
    if (!DbConnectionManager.instance) {
      DbConnectionManager.instance = new DbConnectionManager();
    }
    return DbConnectionManager.instance;
  }

  /**
   * Configure the database with stores and indexes
   */
  public configure(storesConfig: any[]): void {
    this.storesConfig = storesConfig;
  }

  /**
   * Initialize the database
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.getConnection();
      this.initialized = true;
      console.log('Database initialization completed');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get a database connection, creating one if necessary
   */
  public async getConnection(): Promise<IDBDatabase> {
    if (this.connection && !this.connection.closed) {
      return this.connection;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, this.currentVersion);

      request.onerror = () => {
        console.error('Error opening database:', request.error);
        this.connectionPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log(`Database opened successfully with version ${this.currentVersion}`);
        this.connection = request.result;

        // Listen for connection close
        this.connection.onclose = () => {
          console.log('Database connection closed');
          this.connection = null;
        };

        // Check if all stores exist
        if (this.checkStoresExist(this.connection)) {
          this.connectionPromise = null;
          resolve(this.connection);
        } else {
          // Close connection and try with a new version
          this.connection.close();
          this.connection = null;
          this.connectionPromise = null;
          this.currentVersion++;
          
          // Retry with a new version
          this.getConnection().then(resolve).catch(reject);
        }
      };

      request.onupgradeneeded = (event) => {
        console.log(`Database upgrade needed. Old version: ${event.oldVersion}, New version: ${this.currentVersion}`);
        this.createStores(request.result);
      };
    });

    return this.connectionPromise;
  }

  /**
   * Close the database connection
   */
  public closeConnection(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  /**
   * Execute an operation with the database
   */
  public execute<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Create an operation and add it to the queue
      const operationId = ++this.operationCounter;
      
      const dbOperation: DbOperation = {
        id: operationId,
        state: 'pending',
        execute: async () => {
          try {
            const db = await this.getConnection();
            
            return new Promise<T>((txResolve, txReject) => {
              try {
                if (!db.objectStoreNames.contains(storeName)) {
                  txReject(new Error(`Object store '${storeName}' does not exist in the database`));
                  return;
                }
                
                const transaction = db.transaction(storeName, mode);
                const store = transaction.objectStore(storeName);
                
                // Execute the operation
                operation(store)
                  .then(result => {
                    // Handle transaction completion
                    transaction.oncomplete = () => {
                      txResolve(result);
                    };
                    
                    // If transaction already completed, resolve
                    if (transaction.readyState === 'inactive') {
                      txResolve(result);
                    }
                  })
                  .catch(error => {
                    txReject(error);
                  });
                
                transaction.onerror = () => {
                  console.error(`Transaction error for ${storeName}:`, transaction.error);
                  txReject(transaction.error);
                };
                
                transaction.onabort = () => {
                  console.error(`Transaction aborted for ${storeName}`);
                  txReject(new Error('Transaction aborted'));
                };
              } catch (error) {
                txReject(error);
              }
            });
          } catch (error) {
            // Handle database connection errors
            if (
              error instanceof Error && 
              (
                error.name === 'InvalidStateError' || 
                error.message.includes('database connection is closing')
              )
            ) {
              // Connection issue - reset the connection and retry
              this.connection = null;
              this.connectionPromise = null;
              
              // If we haven't reached max retries, throw to trigger retry
              if (dbOperation.retries < this.maxRetries) {
                throw error;
              }
            }
            throw error;
          }
        },
        resolve,
        reject,
        retries: 0
      };

      this.operationQueue.push(dbOperation);
      this.processQueue();
    });
  }

  /**
   * Process the operation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.operationQueue.length > 0) {
        const operation = this.operationQueue[0];
        operation.state = 'running';

        try {
          const result = await operation.execute();
          operation.state = 'completed';
          operation.resolve(result);
        } catch (error) {
          // If it's a connection error and we haven't reached max retries
          if (
            error instanceof Error && 
            (
              error.name === 'InvalidStateError' || 
              error.message.includes('database connection is closing')
            ) && 
            operation.retries < this.maxRetries
          ) {
            // Increment retry count
            operation.retries++;
            console.log(`Retrying operation (${operation.retries}/${this.maxRetries})`);
            
            // Delay before retry
            await new Promise(r => setTimeout(r, 200 * operation.retries));
            
            // Keep the operation in the queue for retry
            continue;
          }
          
          // If exceeded retries or other error
          operation.state = 'failed';
          operation.reject(error);
        }

        // Remove the completed/failed operation from the queue
        this.operationQueue.shift();
      }
    } finally {
      this.isProcessingQueue = false;
      
      // If there are still operations in the queue, process them
      if (this.operationQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Check if all stores exist in the database
   */
  private checkStoresExist(db: IDBDatabase): boolean {
    if (this.storesConfig.length === 0) {
      // If no stores are configured, assume it's correct
      return true;
    }

    const requiredStores = this.storesConfig.map(store => store.name);
    for (const storeName of requiredStores) {
      if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`Missing object store: ${storeName}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Create stores in the database
   */
  private createStores(db: IDBDatabase): void {
    this.storesConfig.forEach(store => {
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
          store.indexes.forEach((index: any) => {
            objectStore.createIndex(index.name, index.keyPath, index.options);
          });
        }
      }
    });

    console.log("Database upgrade completed");
  }
}

export const dbConnectionManager = DbConnectionManager.getInstance();