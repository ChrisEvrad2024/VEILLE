// src/services/cms-editor.service.ts
import { cmsService } from './cms.service';
import { cmsFrontendService } from './cms-frontend.service';
import { cmsPromotionService } from './cms-promotion.service';
import { ComponentItem } from '@/components/cms/editor/DragDropEditor';

/**
 * Service pour gérer l'édition visuelle du CMS
 */
export const cmsEditorService = {
    /**
     * Charge une page et ses composants
     * @param pageId ID de la page
     * @returns Page et composants
     */
    loadPage: async (pageId: string) => {
        // Charger la page
        const page = await cmsService.getPageById(pageId);

        if (!page) {
            throw new Error('Page non trouvée');
        }

        // Analyser les composants
        const pageComponents = cmsFrontendService.parsePageComponents(page.content);

        // Récupérer les données de chaque composant
        const componentsPromises = pageComponents.map(async (comp) => {
            try {
                const componentData = await cmsFrontendService.getComponentData(comp.id, comp.options);

                if (!componentData) {
                    return null;
                }

                return {
                    id: comp.id,
                    type: componentData.type,
                    content: componentData.content,
                    settings: componentData.settings,
                    order: comp.order || 0
                };
            } catch (error) {
                console.error(`Erreur lors du chargement du composant ${comp.id}:`, error);
                return null;
            }
        });

        // Récupérer tous les résultats
        const componentsData = await Promise.all(componentsPromises);

        // Filtrer les composants valides
        const validComponents = componentsData.filter((comp): comp is ComponentItem => comp !== null);

        return {
            page,
            components: validComponents
        };
    },

    /**
     * Enregistre les composants dans une page
     * @param pageId ID de la page
     * @param components Liste des composants
     * @returns Succès de l'opération
     */
    savePageComponents: async (pageId: string, components: ComponentItem[]) => {
        try {
            // Trier les composants par ordre
            const sortedComponents = [...components].sort((a, b) => a.order - b.order);

            // Générer le contenu avec les balises de composants
            let content = "";

            sortedComponents.forEach((component) => {
                // Créer un objet avec le contenu et les paramètres
                const componentData = {
                    content: component.content,
                    settings: component.settings
                };

                // Ajouter la balise de composant au contenu
                content += `\n<!-- component:${component.id}:${component.order}:${JSON.stringify(componentData)} -->`;
            });

            // Mettre à jour la page
            await cmsService.updatePage(pageId, {
                content
            });

            return true;
        } catch (error) {
            console.error("Erreur lors de l'enregistrement des composants:", error);
            throw error;
        }
    },

    /**
     * Récupère les types de composants disponibles
     * @returns Liste des types de composants
     */
    getAvailableComponentTypes: async () => {
        // Liste des types de composants gérés par l'éditeur visuel
        return [
            {
                id: 'banner',
                name: 'Bannière',
                description: 'Grande image avec texte et bouton d\'action'
            },
            {
                id: 'slider',
                name: 'Slider',
                description: 'Carousel d\'images défilantes'
            },
            {
                id: 'promotion',
                name: 'Promotion',
                description: 'Mise en avant d\'offres spéciales'
            },
            {
                id: 'newsletter',
                name: 'Newsletter',
                description: 'Inscription à la newsletter'
            },
            {
                id: 'text',
                name: 'Texte',
                description: 'Bloc de texte simple'
            },
            {
                id: 'video',
                name: 'Vidéo',
                description: 'Intégration de vidéo'
            },
            {
                id: 'html',
                name: 'HTML',
                description: 'Contenu HTML personnalisé'
            },
            {
                id: 'testimonials',
                name: 'Témoignages',
                description: 'Avis clients'
            },
            {
                id: 'featured_products',
                name: 'Produits en vedette',
                description: 'Affichage de produits populaires'
            }
        ];
    },

    /**
     * Récupère les valeurs par défaut pour un nouveau composant
     * @param type Type de composant
     * @returns Contenu et paramètres par défaut
     */
    getComponentDefaults: (type: string) => {
        switch (type) {
            case 'banner':
                return {
                    content: {
                        title: "Titre de la bannière",
                        subtitle: "Sous-titre de la bannière",
                        image: "/assets/logo.jpeg",
                        buttonText: "En savoir plus",
                        buttonLink: "/collections"
                    },
                    settings: {
                        fullWidth: true,
                        height: "medium",
                        textColor: "#ffffff"
                    }
                };
            case 'slider':
                return {
                    content: {
                        slides: [
                            {
                                title: "Collection printemps",
                                description: "Découvrez notre nouvelle collection",
                                image: "/assets/logo.jpeg"
                            },
                            {
                                title: "Livraison gratuite",
                                description: "Pour toute commande supérieure à 50€",
                                image: "/assets/logo.jpeg"
                            }
                        ]
                    },
                    settings: {
                        autoplay: true,
                        interval: 5000,
                        showDots: true
                    }
                };
            case 'promotion':
                return {
                    content: {
                        title: "Offre spéciale",
                        subtitle: "Offre limitée dans le temps",
                        description: "Profitez de cette offre exceptionnelle !",
                        image: "/assets/logo.jpeg",
                        backgroundColor: "#ff5252",
                        textColor: "#ffffff",
                        ctaText: "En profiter",
                        ctaLink: "/promotions",
                        discount: "-20%",
                        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        useActivePromotion: false,
                        promoCode: ""
                    },
                    settings: {
                        fullWidth: true,
                        layout: "horizontal",
                        rounded: true,
                        showBadge: true,
                        badgeText: "PROMO",
                        animateBadge: true,
                        shadow: true
                    }
                };
            default:
                return {
                    content: {},
                    settings: {}
                };
        }
    },

    /**
     * Enrichit un composant de promotion avec des données de promotion réelles
     * @param component Composant à enrichir
     * @returns Composant enrichi avec des données de promotion
     */
    enrichPromotionComponent: async (component: ComponentItem): Promise<ComponentItem> => {
        // Vérifier si c'est un composant de promotion
        if (component.type !== 'promotion') {
            return component;
        }

        try {
            // Si le composant utilise les promotions actives
            if (component.content.useActivePromotion) {
                // Récupérer les promotions actives
                const activePromotions = await cmsPromotionService.getActivePromotions();

                if (activePromotions.length > 0) {
                    // Mettre à jour le composant avec les données de la première promotion active
                    const promo = activePromotions[0];

                    return {
                        ...component,
                        content: {
                            ...component.content,
                            title: component.content.title || promo.name,
                            subtitle: component.content.subtitle || promo.discount,
                            description: component.content.description || promo.description,
                            expiryDate: promo.expiryDate,
                            image: component.content.image || promo.bannerImage,
                            discount: promo.discount
                        }
                    };
                }
            }
            // Si le composant utilise un code promo spécifique
            else if (component.content.promoCode) {
                // Récupérer les données du code promo
                const promoData = await cmsPromotionService.getPromoCodeByCode(component.content.promoCode);

                if (promoData) {
                    return {
                        ...component,
                        content: {
                            ...component.content,
                            discount: promoData.value,
                            expiryDate: promoData.expiryDate,
                            title: component.content.title || `Offre spéciale: ${promoData.code}`,
                            subtitle: component.content.subtitle || (promoData.description || `${promoData.value} de réduction`),
                            description: component.content.description || `Utilisez le code ${promoData.code} pour profiter de cette offre${promoData.minPurchase ? ` à partir de ${promoData.minPurchase}€ d'achat` : ''}.`
                        }
                    };
                }
            }
        } catch (error) {
            console.error("Erreur lors de l'enrichissement du composant de promotion:", error);
        }

        // Retourner le composant inchangé si l'enrichissement a échoué
        return component;
    },

    /**
     * Récupère la liste des codes promo disponibles pour l'éditeur
     * @returns Liste des codes promo
     */
    getAvailablePromoCodes: async () => {
        try {
            return await cmsPromotionService.getActivePromoCodes();
        } catch (error) {
            console.error("Erreur lors de la récupération des codes promo:", error);
            return [];
        }
    }
};