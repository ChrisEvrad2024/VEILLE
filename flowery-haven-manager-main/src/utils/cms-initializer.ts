// src/utils/cms-initializer.ts
import { cmsService } from '@/services/cms.service';
import { cmsFrontendService } from '@/services/cms-frontend.service';
import { promotionService } from '@/services/promotion.service';

/**
 * Utilitaire pour initialiser les composants CMS et créer des pages avec ces composants
 */
export const cmsInitializer = {
    /**
     * Initialise les composants CMS par défaut
     */
    initializeDefaultComponents: async () => {
        try {
            console.log("Initialisation des composants CMS par défaut...");

            // Vérifier si des composants existent déjà
            const existingComponents = await cmsService.getAllComponents();

            if (existingComponents.length === 0) {
                // Création de la bannière principale
                const bannerComponent = await cmsService.createComponent(
                    "Bannière principale",
                    "banner",
                    {
                        title: "Bienvenue chez Flora",
                        subtitle: "Des fleurs fraîches pour toutes les occasions",
                        buttonText: "Découvrir notre collection",
                        buttonLink: "/catalog",
                        image: "https://images.unsplash.com/photo-1508380702597-707c1b00695c?q=80&w=1974"
                    },
                    {
                        fullWidth: true,
                        height: "large",
                        textColor: "#ffffff"
                    }
                );
                console.log("Bannière créée:", bannerComponent.id);

                // Création du composant de promotion
                const promotionComponent = await cmsService.createComponent(
                    "Promotions en cours",
                    "promotion",
                    {
                        title: "Nos offres spéciales",
                        subtitle: "Profitez de nos promotions pour embellir votre intérieur",
                        showPromoCodes: true,
                        showPromotions: true,
                        maxItems: 3,
                        buttonText: "Voir toutes les promotions",
                        buttonLink: "/promotions"
                    },
                    {
                        backgroundColor: "#f9fafb",
                        accentColor: "#10b981",
                        displayType: "grid",
                        showExpiryDate: true,
                        paddingY: "py-12"
                    }
                );
                console.log("Composant promotion créé:", promotionComponent.id);

                // Création du composant de newsletter
                const newsletterComponent = await cmsService.createComponent(
                    "Newsletter",
                    "newsletter",
                    {
                        title: "Restez informé",
                        description: "Abonnez-vous à notre newsletter pour recevoir nos actualités et offres exclusives",
                        buttonText: "S'abonner"
                    },
                    {
                        layout: "stacked",
                        backgroundColor: "#f3f4f6"
                    }
                );
                console.log("Newsletter créée:", newsletterComponent.id);

                // Création d'un slider
                const sliderComponent = await cmsService.createComponent(
                    "Slider promotionnel",
                    "slider",
                    {
                        slides: [
                            {
                                title: "Collection printemps",
                                description: "Découvrez notre nouvelle collection de saison",
                                image: "https://images.unsplash.com/photo-1469259943454-aa100abba749?q=80&w=2070"
                            },
                            {
                                title: "Livraison gratuite",
                                description: "Pour toute commande supérieure à 50€",
                                image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2070"
                            },
                            {
                                title: "Service personnalisé",
                                description: "Nos fleuristes créent des compositions sur-mesure",
                                image: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=2070"
                            }
                        ]
                    },
                    {
                        autoplay: true,
                        interval: 5000,
                        showDots: true
                    }
                );
                console.log("Slider créé:", sliderComponent.id);

                console.log("Composants CMS initialisés avec succès");
            } else {
                console.log("Des composants CMS existent déjà, initialisation ignorée");
            }

            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation des composants CMS:", error);
            return false;
        }
    },

    

    /**
     * Initialise un code promo de bienvenue
     */
    initializeWelcomePromoCode: async () => {
        try {
            // Vérifier si des codes promo existent déjà
            let existingCodes = [];
            try {
                existingCodes = await promotionService.getAllPromoCodes();
            } catch (error) {
                console.warn("Erreur lors de la récupération des codes promo, création de nouveaux codes:", error);
            }

            if (existingCodes.length === 0) {
                try {
                    console.log("Création des codes promo de bienvenue...");
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + 3); // Valable 3 mois

                    // Code promo de bienvenue
                    await promotionService.createPromoCode(
                        "BIENVENUE",
                        "percentage",
                        10,
                        startDate,
                        endDate,
                        {
                            description: "10% de réduction sur votre première commande",
                            minPurchase: 30,
                            isActive: true,
                            singleUse: true
                        }
                    );

                    // Code promo livraison gratuite
                    await promotionService.createPromoCode(
                        "LIVRAISON",
                        "free_shipping",
                        0,
                        startDate,
                        endDate,
                        {
                            description: "Livraison gratuite sans minimum d'achat",
                            isActive: true
                        }
                    );

                    // Code promo bouquet
                    await promotionService.createPromoCode(
                        "BOUQUET10",
                        "fixed",
                        10,
                        startDate,
                        endDate,
                        {
                            description: "10€ de réduction sur nos bouquets",
                            minPurchase: 50,
                            isActive: true,
                            productCategories: ["bouquets"]
                        }
                    );

                    console.log("Codes promo de bienvenue créés avec succès");
                } catch (error) {
                    console.error("Erreur lors de la création des codes promo:", error);
                    // Continue malgré l'erreur
                }
            } else {
                console.log("Des codes promo existent déjà, initialisation ignorée");
            }

            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation des codes promo:", error);
            return false;
        }
    },

    /**
     * Ajoute des composants CMS à la page d'accueil
     */
    setupHomePage: async () => {
        try {
            // Récupérer la page d'accueil
            const homePage = await cmsFrontendService.getHomePage();

            if (!homePage) {
                console.error("Page d'accueil non trouvée");
                return false;
            }

            // Récupérer tous les composants
            const components = await cmsService.getAllComponents();

            if (components.length === 0) {
                console.error("Aucun composant CMS trouvé");
                return false;
            }

            // Vérifier si la page contient déjà des composants
            const existingComponents = cmsFrontendService.parsePageComponents(homePage.content);

            if (existingComponents.length > 0) {
                console.log("La page d'accueil contient déjà des composants, configuration ignorée");
                return true;
            }

            // Trouver les composants par type
            const bannerComponent = components.find(c => c.type === 'banner');
            const sliderComponent = components.find(c => c.type === 'slider');
            const promotionComponent = components.find(c => c.type === 'promotion');
            const newsletterComponent = components.find(c => c.type === 'newsletter');

            // Nouveau contenu de la page avec les balises de composants et zones
            let newContent = homePage.content || '';

            // Ajouter les composants dans l'ordre avec leurs zones
            if (bannerComponent) {
                newContent += `\n<!-- component:${bannerComponent.id}:10:{"zone":"top"} -->`;
            }

            if (promotionComponent) {
                newContent += `\n<!-- component:${promotionComponent.id}:20:{"zone":"promotions"} -->`;
            }

            if (sliderComponent) {
                newContent += `\n<!-- component:${sliderComponent.id}:30:{"zone":"middle"} -->`;
            }

            if (newsletterComponent) {
                newContent += `\n<!-- component:${newsletterComponent.id}:40:{"zone":"bottom"} -->`;
            }

            // Mettre à jour la page
            await cmsService.updatePage(homePage.id, {
                content: newContent
            });

            console.log("Page d'accueil configurée avec succès");
            return true;
        } catch (error) {
            console.error("Erreur lors de la configuration de la page d'accueil:", error);
            return false;
        }
    },

    /**
     * Initialise tout le système CMS
     */
    initializeAll: async () => {
        try {
            console.log("Initialisation complète du système CMS...");

            // Initialiser les pages par défaut
            await cmsService.initDefaultPages();
            console.log("Pages par défaut initialisées");

            // Initialiser les composants
            const componentsInitialized = await cmsInitializer.initializeDefaultComponents();
            console.log("Composants initialisés:", componentsInitialized);

            // Initialiser les codes promo
            const promoCodesInitialized = await cmsInitializer.initializeWelcomePromoCode();
            console.log("Codes promo initialisés:", promoCodesInitialized);

            // Configurer la page d'accueil avec les composants
            const homePageSetup = await cmsInitializer.setupHomePage();
            console.log("Page d'accueil configurée:", homePageSetup);

            console.log("Système CMS initialisé avec succès");
            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation du système CMS:", error);
            return false;
        }
    },

    /**
     * Vérifie et corrige les problèmes connus avec la configuration
     */
    fixCommonIssues: async () => {
        try {
            console.log("Vérification et correction des problèmes connus...");

            // 1. Vérifier et corriger les pages sans composants
            const homePage = await cmsFrontendService.getHomePage();
            if (homePage) {
                const components = cmsFrontendService.parsePageComponents(homePage.content);
                if (components.length === 0) {
                    console.log("Page d'accueil sans composants, ajout des composants...");
                    await cmsInitializer.setupHomePage();
                }
            }

            // 2. Vérifier si des composants de promotion existent
            const components = await cmsService.getAllComponents();
            const hasPromotion = components.some(c => c.type === 'promotion');

            if (!hasPromotion) {
                console.log("Aucun composant de promotion trouvé, création...");
                await cmsService.createComponent(
                    "Promotions en cours",
                    "promotion",
                    {
                        title: "Nos offres spéciales",
                        subtitle: "Profitez de nos promotions pour embellir votre intérieur",
                        showPromoCodes: true,
                        showPromotions: true,
                        maxItems: 3,
                        buttonText: "Voir toutes les promotions",
                        buttonLink: "/promotions"
                    },
                    {
                        backgroundColor: "#f9fafb",
                        accentColor: "#10b981",
                        displayType: "grid",
                        showExpiryDate: true,
                        paddingY: "py-12"
                    }
                );
            }

            // 3. Vérifier les codes promo
            try {
                const promoCodes = await promotionService.getAllPromoCodes();
                if (promoCodes.length === 0) {
                    console.log("Aucun code promo trouvé, initialisation...");
                    await cmsInitializer.initializeWelcomePromoCode();
                }
            } catch (error) {
                console.error("Erreur lors de la vérification des codes promo:", error);
            }

            console.log("Vérification et correction terminées");
            return true;
        } catch (error) {
            console.error("Erreur lors de la correction des problèmes:", error);
            return false;
        }
    },
    
};