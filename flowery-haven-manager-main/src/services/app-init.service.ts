// src/services/app-init.service.ts
import { dbService } from './db.service';
import { cmsService } from './cms.service';

/**
 * Service for initializing the application
 */
export const appInitService = {
  /**
   * Initialize the application
   * This ensures the database is set up before any other services try to use it
   */
  initialize: async (): Promise<void> => {
    try {
      console.log('Initializing application...');
      
      // First, initialize the database structure
      await dbService.init();
      
      // Then, initialize default CMS data if needed
      await cmsService.initDefaultPages();
      
      console.log('Application initialized successfully!');
    } catch (error) {
      console.error('Error initializing application:', error);
      throw error;
    }
  }
};

export default appInitService;