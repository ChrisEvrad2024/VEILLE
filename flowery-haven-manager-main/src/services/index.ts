// src/services/index.ts
import { dbService } from './db.service';
import { authService } from './auth.service';
import { productService } from './product.service';
import { cartService } from './cart.service';
import { wishlistService } from './wishlist.service';
import { orderService } from './order.service';
import { addressService } from './address.service';
import { blogService } from './blog.service';
import { initService } from './init.service';
import { quoteService } from './quote.service';
import { promotionService } from './promotion.service';
import { newsletterService } from './newsletter.service';
import { dashboardService } from './dashboard.service';
import { paymentService } from './payment.service';
import { cmsService } from './cms.service';
import { cmsFrontendService } from './cms-frontend.service';
import { analyticsService } from './analytics.service';
import { ratingService } from './rating.service';
import { userManagementService } from './user-management.service';
import { loginHistoryService } from './login-history.service';
import { imageService } from './image.service';
import { cmsInitializer } from '@/utils/cms-initializer';

import {
    cartAdapter,
    wishlistAdapter,
    dataAdapter,
    blogAdapter,
    authAdapter,
    quoteAdapter,
    promoAdapter,
    newsletterAdapter,
    dashboardAdapter,
    cmsAdapter,
    ratingAdapter,
    userAdapter,
    addressAdapter
} from './adapters';

// Initialiser la base de données au démarrage
const initialize = async () => {
    try {
        // Initialiser la base de données principale
        await initService.initializeDatabase();
        
        // Initialiser les services associés
        await paymentService.initDefaultPaymentMethods();
        await cmsService.initDefaultPages();
        await userManagementService.initDefaultRoles();
        
        // Initialiser le système CMS avancé avec les composants et promotions
        await cmsInitializer.initializeAll();
        
        console.log("Database and services initialization complete!");
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
};

export {
    // Services de base de données
    dbService,
    
    // Services utilisateur et authentification
    authService,
    userManagementService,
    loginHistoryService,
    
    // Services liés aux produits et catalogue
    productService,
    imageService,
    cartService,
    wishlistService,
    ratingService,
    
    // Services liés aux commandes
    orderService,
    addressService,
    paymentService,
    quoteService,
    
    // Services marketing et newsletter
    promotionService,
    newsletterService,
    
    // Services de contenu
    blogService,
    cmsService,
    cmsFrontendService,  // Ajout de l'export du service frontend CMS
    
    // Services d'analyse
    dashboardService,
    analyticsService,
    
    // Service d'initialisation
    initService,
    
    // Adaptateurs
    cartAdapter,
    wishlistAdapter,
    dataAdapter,
    blogAdapter,
    authAdapter,
    quoteAdapter,
    promoAdapter,
    newsletterAdapter,
    dashboardAdapter,
    cmsAdapter,
    ratingAdapter,
    userAdapter,
    addressAdapter,
    
    // Initialisation
    initialize
};