// src/services/cms-frontend.service.ts
import { cmsService, PageContent, CMSComponent } from './cms.service';
import { promotionService } from './promotion.service';

/**
 * Service pour gérer l'accès au CMS depuis le frontend
 */
export const cmsFrontendService = {
    /**
     * Récupère une page par son slug
     * @param slug Slug de la page
     * @returns La page ou null si elle n'existe pas
     */
    getPageBySlug: async (slug: string): Promise<PageContent | null> => {
        try {
            // On s'assure que les pages non publiées ne sont pas visibles
            const page = await cmsService.getPageBySlug(slug);
            if (!page || !page.published) {
                return null;
            }

            return page;
        } catch (error) {
            console.error(`Erreur lors de la récupération de la page ${slug}:`, error);
            return null;
        }
    },

    /**
     * Récupère la page d'accueil
     * @returns La page d'accueil ou null si elle n'existe pas
     */
    getHomePage: async (): Promise<PageContent | null> => {
        try {
            // Récupère toutes les pages (publiées uniquement) et trouve celle marquée comme page d'accueil
            const pages = await cmsService.getAllPages(false);
            const homePage = pages.find(page => page.isHomepage && page.published);

            if (!homePage) {
                // Fallback: essaie de trouver une page avec le slug "home"
                return await cmsFrontendService.getPageBySlug("home");
            }

            return homePage;
        } catch (error) {
            console.error("Erreur lors de la récupération de la page d'accueil:", error);
            return null;
        }
    },

    /**
     * Récupère un composant par son ID
     * @param id ID du composant
     * @returns Le composant ou null s'il n'existe pas
     */
    getComponentById: async (id: string): Promise<CMSComponent | null> => {
        try {
            // Récupère tous les composants (actifs uniquement)
            const components = await cmsService.getAllComponents(true);
            return components.find(component => component.id === id) || null;
        } catch (error) {
            console.error(`Erreur lors de la récupération du composant ${id}:`, error);
            return null;
        }
    },

    /**
     * Récupère les données nécessaires pour rendre un composant sur une page 
     * @param componentId ID du composant
     * @param data Données du composant spécifiques à la page (remplace les valeurs par défaut)
     * @returns Un objet contenant les données et paramètres du composant
     */
    getComponentData: async (componentId: string, data?: any): Promise<{
        type: string;
        content: any;
        settings: any;
    } | null> => {
        try {
            const component = await cmsFrontendService.getComponentById(componentId);

            if (!component || !component.isActive) {
                return null;
            }

            // Si c'est un composant de promotion, enrichir avec les données réelles
            if (component.type === 'promotion') {
                await cmsFrontendService.enrichPromotionComponent(component);
            }

            // Combine les données par défaut du composant avec les données spécifiques
            return {
                type: component.type,
                content: { ...component.content, ...(data?.content || {}) },
                settings: { ...component.settings, ...(data?.settings || {}) }
            };
        } catch (error) {
            console.error(`Erreur lors de la récupération des données du composant ${componentId}:`, error);
            return null;
        }
    },

    /**
     * Enrichit un composant de promotion avec des données réelles
     * @param component Le composant de promotion à enrichir
     */
    enrichPromotionComponent: async (component: CMSComponent): Promise<void> => {
        try {
            // Pour les composants de promotion, on peut pré-charger les promotions
            // et les codes promo actifs pour améliorer les performances
            if (component.type === 'promotion') {
                // Si le composant veut afficher des codes promo
                if (component.content.showPromoCodes) {
                    // Préchargement des codes promo pour avoir accès aux données
                    const promoCodes = await promotionService.getActivePromoCodes();

                    // Si un code spécifique est demandé, on le met en premier
                    if (component.content.codeToDisplay) {
                        const specificCode = promoCodes.find(
                            code => code.code === component.content.codeToDisplay
                        );
                        if (specificCode) {
                            // On ajoute les données du code pour que le composant puisse les utiliser
                            component.content.preloadedCode = specificCode;
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Erreur lors de l'enrichissement du composant de promotion:`, error);
        }
    },

    /**
     * Ajoute un composant à une page existante
     * @param pageId ID de la page
     * @param componentId ID du composant à ajouter
     * @param order Ordre d'affichage du composant
     * @param data Données spécifiques pour ce composant sur cette page
     * @returns true si l'ajout a réussi, false sinon
     */
    addComponentToPage: async (
        pageId: string,
        componentId: string,
        order: number = 0,
        data?: any
    ): Promise<boolean> => {
        try {
            // Vérifier que l'utilisateur est administrateur (cela sera vérifié par cmsService.updatePage)
            const page = await cmsService.getPageById(pageId);

            if (!page) {
                console.error(`Page ${pageId} non trouvée`);
                return false;
            }

            // Créer la balise de composant
            const componentTag = data
                ? `<!-- component:${componentId}:${order}:${JSON.stringify(data)} -->`
                : `<!-- component:${componentId}:${order} -->`;

            // Ajouter la balise de composant au contenu de la page
            const updatedContent = page.content + '\n' + componentTag;

            // Mettre à jour la page
            await cmsService.updatePage(pageId, {
                content: updatedContent
            });

            return true;
        } catch (error) {
            console.error(`Erreur lors de l'ajout du composant ${componentId} à la page ${pageId}:`, error);
            return false;
        }
    },

    /**
 * Parse les composants d'une page à partir de son contenu
 * @param content Contenu de la page
 * @returns Liste des composants identifiés
 */
    parsePageComponents: (content: string): Array<{
        id: string;
        type?: string;
        order: number;
        options?: any;
    }> => {
        const components: Array<{
            id: string;
            type?: string;
            order: number;
            options?: any;
        }> = [];

        if (!content) {
            return components;
        }

        try {
            // Essayer d'abord de parser le contenu comme JSON
            try {
                const jsonContent = JSON.parse(content);
                if (jsonContent && jsonContent.components && Array.isArray(jsonContent.components)) {
                    return jsonContent.components.map((comp: any, index: number) => ({
                        id: comp.id || `component-${index}`,
                        type: comp.type,
                        order: index * 10,
                        options: comp.settings || {}
                    }));
                }
            } catch (e) {
                // Pas un JSON valide, continuer avec la méthode regex
            }

            // Rechercher les balises de composant dans le HTML
            // Format: <!-- component:COMPONENT_ID:ORDER:OPTIONS_JSON -->
            const componentRegex = /<!--\s*component:([^:]+):(\d+):({.*?})\s*-->/g;
            let match;

            while ((match = componentRegex.exec(content)) !== null) {
                const [, componentId, orderStr, optionsJson] = match;
                let options = {};

                try {
                    options = JSON.parse(optionsJson);
                } catch (e) {
                    console.error(`Erreur lors du parsing des options pour le composant ${componentId}:`, e);
                }

                components.push({
                    id: componentId,
                    order: parseInt(orderStr, 10),
                    options
                });
            }

            // Trier les composants par ordre
            return components.sort((a, b) => a.order - b.order);
        } catch (error) {
            console.error("Erreur lors du parsing des composants de la page:", error);
            return [];
        }
    }
};