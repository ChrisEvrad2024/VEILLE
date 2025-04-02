// src/services/init.service.ts
import { dbService } from './db.service';
import { Product, Category } from './product.service';
import { BlogPost } from './blog.service';
import { User } from './auth.service';
import { PaymentMethod } from './payment.service';
import { PageContent } from './cms.service';
import { UserRole } from './user-management.service';

// Données de démo pour les produits
const sampleProducts: Product[] = [
    // Your sample products would go here
];

// Données de démo pour les catégories
const sampleCategories: Category[] = [
    {
        id: 'fresh-flowers',
        name: 'Fleurs Fraîches',
        description: 'Des fleurs fraîchement coupées pour illuminer votre intérieur.'
    },
    {
        id: 'bouquets',
        name: 'Bouquets',
        description: 'Compositions florales magnifiquement arrangées pour toutes les occasions.'
    },
];

// Données de démo pour les articles de blog
const sampleBlogPosts: BlogPost[] = [
    // Your sample blog posts would go here
];

// Données de démo pour les utilisateurs
const sampleUsers: User[] = [
    {
        id: "admin_1",
        email: "admin@admin.com",
        password: "admin123", // Dans une vraie application, ce serait hashé
        firstName: "Admin",
        lastName: "System",
        role: "admin",
        createdAt: new Date("2023-01-01")
    },
    {
        id: "user_1",
        email: "user@example.com",
        password: "password123", // Dans une vraie application, ce serait hashé
        firstName: "Jean",
        lastName: "Dupont",
        role: "customer",
        createdAt: new Date("2023-02-15")
    },
    {
        id: "sadmin1",
        email: "sadmin@sadmin.com",
        password: "sadmin123", // Dans une vraie application, ce serait hashé
        firstName: "Admin",
        lastName: "System",
        role: "super_admin",
        createdAt: new Date("2023-01-01")
    }
];

// Données de démo pour les méthodes de paiement
const samplePaymentMethods: PaymentMethod[] = [
    {
        id: "payment_1",
        name: "Carte de crédit",
        type: "credit_card",
        isActive: true,
        config: {
            sandbox: true,
            apiKey: "demo_key",
            secretKey: "demo_secret",
            merchantId: "demo_merchant"
        },
        icon: "credit-card",
        position: 1,
        requiresShipping: true,
        availableCountries: ["*"],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: "payment_2",
        name: "PayPal",
        type: "paypal",
        isActive: true,
        config: {
            sandbox: true,
            apiKey: "demo_paypal_id",
            secretKey: "demo_paypal_secret"
        },
        icon: "paypal",
        position: 2,
        requiresShipping: true,
        availableCountries: ["*"],
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Données de démo pour les pages CMS
const sampleCmsPages: PageContent[] = [
    {
        id: "page_1",
        title: "Accueil",
        slug: "home",
        content: `
            <div class="hero">
                <h1>Bienvenue chez Flora</h1>
                <p>Des fleurs fraîches et des arrangements floraux pour toutes les occasions</p>
            </div>
            
            <div class="featured-products">
                <h2>Nos produits vedettes</h2>
                <p>Découvrez notre sélection de bouquets et plantes soigneusement préparés par nos fleuristes.</p>
            </div>
            
            <div class="categories">
                <h2>Nos catégories</h2>
                <p>Explorez notre gamme complète de produits floraux.</p>
            </div>
            
            <div class="testimonials">
                <h2>Avis de nos clients</h2>
                <p>Découvrez ce que nos clients disent de nos services.</p>
            </div>
        `,
        metaTitle: "Chez Flora - Fleurs fraîches et arrangements floraux",
        metaDescription: "Boutique en ligne de fleurs fraîches, bouquets et arrangements floraux pour toutes les occasions.",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        createdBy: "admin_1",
        updatedBy: "admin_1",
        type: "page",
        isHomepage: true
    },
    {
        id: "page_2",
        title: "À propos",
        slug: "about",
        content: `
            <h1>À propos de Chez Flora</h1>
            
            <div class="story">
                <h2>Notre histoire</h2>
                <p>Créée en 2020, Chez Flora est née de la passion pour les fleurs de sa fondatrice, Marie Lambert. Après des années d'expérience dans des boutiques traditionnelles, Marie a souhaité proposer une expérience florale différente, combinant l'artisanat traditionnel et la commodité du commerce en ligne.</p>
            </div>
            
            <div class="mission">
                <h2>Notre mission</h2>
                <p>Chez Flora s'engage à offrir des fleurs fraîches de qualité supérieure, des arrangements soigneusement conçus et un service client exceptionnel. Nous travaillons directement avec des producteurs locaux et internationaux qui partagent notre engagement envers la durabilité et des pratiques éthiques.</p>
            </div>
            
            <div class="team">
                <h2>Notre équipe</h2>
                <p>Notre équipe de fleuristes passionnés transforme chaque commande en une œuvre d'art unique. Formés aux techniques traditionnelles et modernes, ils sélectionnent minutieusement chaque fleur pour garantir fraîcheur et longévité.</p>
            </div>
        `,
        metaTitle: "À propos de Chez Flora - Notre histoire et notre équipe",
        metaDescription: "Découvrez l'histoire de Chez Flora, notre équipe de fleuristes passionnés et notre engagement pour la qualité et la fraîcheur.",
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        createdBy: "admin_1",
        updatedBy: "admin_1",
        type: "page"
    }
];

// Sample data for CMS revisions
const sampleCmsRevisions = [
    {
        id: "revision_1",
        pageId: "page_1",
        revisionNumber: 1,
        title: "Accueil",
        content: "<h1>Bienvenue chez Flora</h1><p>Version initiale</p>",
        createdAt: new Date(),
        createdBy: "admin_1"
    }
];

// Sample data for CMS components
const sampleCmsComponents = [
    {
        id: "component_1",
        name: "Banner principal",
        type: "banner",
        content: {
            title: "Bienvenue chez Flora",
            subtitle: "Des fleurs fraîches pour toutes les occasions",
            buttonText: "Découvrir",
            buttonLink: "/boutique",
            image: "/assets/images/banner.jpg"
        },
        settings: {
            fullWidth: true,
            height: "large",
            textColor: "#ffffff"
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin_1",
        updatedBy: "admin_1"
    }
];

// Sample data for CMS templates
const sampleCmsTemplates = [
    {
        id: "template_1",
        name: "Page standard",
        description: "Template pour les pages de contenu standard",
        structure: [
            {
                name: "En-tête",
                type: "section",
            },
            {
                name: "Zone de contenu principal",
                type: "component",
                allowedComponents: ["text", "image", "video"]
            },
            {
                name: "Pied de page",
                type: "section",
            }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Données de démo pour les rôles utilisateurs
const sampleUserRoles: UserRole[] = [
    {
        id: "role_1",
        name: "Super Admin",
        permissions: [
            "product_view", "product_create", "product_update", "product_delete",
            "order_view", "order_update", "order_cancel",
            "customer_view", "customer_create", "customer_update", "customer_delete",
            "review_moderate",
            "blog_view", "blog_create", "blog_update", "blog_delete",
            "cms_view", "cms_create", "cms_update", "cms_delete",
            "promo_view", "promo_create", "promo_update", "promo_delete",
            "user_view", "user_create", "user_update", "user_delete",
            "role_manage",
            "stats_view",
            "settings_view", "settings_update"
        ],
        description: "Accès complet à toutes les fonctionnalités du système",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: "role_2",
        name: "Admin",
        permissions: [
            "product_view", "product_create", "product_update", "product_delete",
            "order_view", "order_update", "order_cancel",
            "customer_view",
            "review_moderate",
            "blog_view", "blog_create", "blog_update", "blog_delete",
            "cms_view", "cms_create", "cms_update",
            "promo_view", "promo_create", "promo_update",
            "stats_view",
            "settings_view"
        ],
        description: "Accès à la plupart des fonctionnalités administratives excepté la gestion des utilisateurs",
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Track initialization status
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Check if data already exists in the database
const checkIfDataExists = async (): Promise<boolean> => {
    try {
        // Check if any users exist as a way to determine if data has been initialized
        const users = await dbService.getAllItems<User>("users");
        return users.length > 0;
    } catch (error) {
        console.error("Error checking if data exists:", error);
        return false;
    }
};

// Initialize a specific collection with sample data
const initializeCollection = async <T>(
    collectionName: string, 
    sampleData: T[], 
    checkExisting: boolean = true
): Promise<void> => {
    try {
        // Check if data already exists if required
        if (checkExisting) {
            const existingItems = await dbService.getAllItems(collectionName);
            if (existingItems.length > 0) {
                console.log(`Collection ${collectionName} already has data, skipping initialization`);
                return;
            }
        }
        
        console.log(`Initializing ${collectionName} with ${sampleData.length} items`);
        
        // Add each item with a small delay to avoid database contention
        for (const item of sampleData) {
            await dbService.addItem(collectionName, item);
            // Small delay to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        console.log(`${collectionName} initialization complete`);
    } catch (error) {
        console.error(`Error initializing ${collectionName}:`, error);
        throw error;
    }
};

// Fonction d'initialisation complète
const initializeDatabase = async (): Promise<void> => {
    // Prevent multiple simultaneous initializations
    if (initPromise) {
        return initPromise;
    }
    
    // Create a promise for initialization
    initPromise = (async () => {
        if (isInitialized) {
            return;
        }
        
        try {
            console.log("Starting database initialization...");
            
            // Make sure database is initialized first
            await dbService.ensureDatabaseInitialized();
            
            // Check if data already exists to avoid duplication
            const existingUserCheck = await checkIfDataExists();
            
            if (!existingUserCheck) {
                console.log("Initializing database with sample data...");

                // Initialize collections in sequence to avoid database contention
                
                // Start with users and roles
                await initializeCollection("users", sampleUsers);
                await initializeCollection("userRoles", sampleUserRoles);
                
                // Then initialize CMS related collections
                await initializeCollection("cmsTemplates", sampleCmsTemplates);
                await initializeCollection("cmsPages", sampleCmsPages);
                await initializeCollection("cmsRevisions", sampleCmsRevisions);
                await initializeCollection("cmsComponents", sampleCmsComponents);
                
                // Then initialize product related collections
                await initializeCollection("categories", sampleCategories);
                await initializeCollection("products", sampleProducts);
                
                // Finally initialize other collections
                await initializeCollection("blog", sampleBlogPosts);
                await initializeCollection("paymentMethods", samplePaymentMethods);

                console.log("Database initialized with sample data!");
            } else {
                console.log("Database already contains data. Skipping initialization.");
            }
            
            isInitialized = true;
        } catch (error) {
            console.error("Error initializing database:", error);
            // Reset initPromise so we can try again
            initPromise = null;
            throw error;
        }
    })();
    
    return initPromise;
};

// Fonctions de mise à jour et maintenance
const clearDatabase = async (): Promise<void> => {
    if (process.env.NODE_ENV === 'development' || process.env.ALLOW_DB_CLEAR === 'true') {
        try {
            console.log("Clearing database...");
            
            const stores = [
                "products", "categories", "users", "blog", "blogComments",
                "addresses", "cart", "wishlist", "orders", "quoteRequests", 
                "quoteProposals", "promoCodes", "promotions", "newsletterSubscribers", 
                "newsletterCampaigns", "paymentMethods", "cmsPages", "cmsRevisions", 
                "cmsComponents", "cmsTemplates", "productReviews", "reviewVotes", 
                "userRoles", "adminActions", "analyticsPageViews", "analyticsProductViews",
                "analyticsCartActions", "analyticsSearches", "analyticsSessions"
            ];
            
            // Clear stores in sequence
            for (const store of stores) {
                await dbService.clearStore(store);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Reset initialized flag
            isInitialized = false;
            initPromise = null;
            
            console.log("Database cleared successfully!");
        } catch (error) {
            console.error("Error clearing database:", error);
            throw error;
        }
    } else {
        console.error("Database clearing is only allowed in development mode or with ALLOW_DB_CLEAR=true");
    }
};

// Application initialization function that should be called at app startup
const initializeApplication = async (): Promise<void> => {
    try {
        console.log("Starting application initialization...");
        
        // First ensure the database structure is initialized
        await dbService.ensureDatabaseInitialized();
        
        // Then load sample data if needed
        await initializeDatabase();
        
        console.log("Application initialization complete!");
    } catch (error) {
        console.error("Error during application initialization:", error);
        throw error;
    }
};

export const initService = {
    initializeDatabase,
    clearDatabase,
    initializeApplication
};