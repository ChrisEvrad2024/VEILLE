// src/services/cms-frontend.service.ts
import { cmsService, PageContent, CMSComponent } from './cms.service';

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
    }
};