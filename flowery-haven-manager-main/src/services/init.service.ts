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

// Fonction d'initialisation complète
const initializeDatabase = async (): Promise<void> => {
    try {
        // Initialiser la base de données
        await dbService.initDatabase();

        // Vérifier si les données de démo existent déjà
        const existingProducts = await dbService.getAllItems<Product>("products");

        if (existingProducts.length === 0) {
            console.log("Initializing database with sample data...");

            // Ajouter les catégories
            for (const category of sampleCategories) {
                await dbService.addItem("categories", category);
            }

            // Ajouter les produits
            for (const product of sampleProducts) {
                await dbService.addItem("products", product);
            }

            // Ajouter les articles de blog
            for (const post of sampleBlogPosts) {
                await dbService.addItem("blog", post);
            }

            // Ajouter les utilisateurs
            for (const user of sampleUsers) {
                await dbService.addItem("users", user);
            }

            // Ajouter les méthodes de paiement
            for (const method of samplePaymentMethods) {
                await dbService.addItem("paymentMethods", method);
            }

            // Ajouter les pages CMS
            for (const page of sampleCmsPages) {
                await dbService.addItem("cmsPages", page);
            }

            // Ajouter les rôles utilisateurs
            for (const role of sampleUserRoles) {
                await dbService.addItem("userRoles", role);
            }

            // Créer les stores supplémentaires pour les autres services
            const additionalStores = [
                "addresses", "cart", "wishlist", "orders", "quoteRequests", "quoteProposals",
                "promoCodes", "promotions", "newsletterSubscribers", "newsletterCampaigns",
                "cmsRevisions", "cmsComponents", "cmsTemplates", "productReviews", 
                "reviewVotes", "adminActions", "analyticsPageViews", "analyticsProductViews",
                "analyticsCartActions", "analyticsSearches", "analyticsSessions"
            ];

            for (const store of additionalStores) {
                try {
                    // Vérification que le store existe déjà ou création si nécessaire
                    const testItem = { id: `test_${Date.now()}`, testField: true };
                    await dbService.addItem(store, testItem);
                    await dbService.deleteItem(store, testItem.id);
                } catch (error) {
                    console.warn(`Store ${store} initialization failed:`, error);
                }
            }

            console.log("Database initialized with sample data!");
        } else {
            console.log("Database already contains data. Skipping initialization.");
        }
    } catch (error) {
        console.error("Error initializing database:", error);
        throw error;
    }
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
            
            for (const store of stores) {
                await dbService.clearStore(store);
            }
            
            console.log("Database cleared successfully!");
        } catch (error) {
            console.error("Error clearing database:", error);
            throw error;
        }
    } else {
        console.error("Database clearing is only allowed in development mode or with ALLOW_DB_CLEAR=true");
    }
};

export const initService = {
    initializeDatabase,
    clearDatabase
};