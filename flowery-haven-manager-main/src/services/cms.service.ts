// src/services/cms.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

// Types pour le CMS
export interface PageContent {
    id: string;
    title: string;
    slug: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    createdBy: string;
    updatedBy: string;
    template?: string;
    order?: number;
    parent?: string;
    type: 'page' | 'section' | 'component';
    isHomepage?: boolean;
}

export interface PageRevision {
    id: string;
    pageId: string;
    revisionNumber: number;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    createdAt: Date;
    createdBy: string;
    restoredAt?: Date;
    restoredBy?: string;
}

export interface CMSComponent {
    id: string;
    name: string;
    type: 'banner' | 'slider' | 'featured_products' | 'newsletter' | 'testimonials' | 'text' | 'image' | 'video' | 'html' | 'custom';
    content: any; // Structure dépendante du type
    isActive: boolean;
    settings?: any;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}

export interface CMSTemplate {
    id: string;
    name: string;
    description?: string;
    structure: Array<{
        name: string;
        type: 'section' | 'component';
        allowedComponents?: string[];
    }>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ===== GESTION DES PAGES =====

// Obtenir toutes les pages
const getAllPages = async (includeUnpublished: boolean = false): Promise<PageContent[]> => {
    try {
        let pages = await dbService.getAllItems<PageContent>("cmsPages");
        
        // Filtrer les pages non publiées si nécessaire
        if (!includeUnpublished && !authService.isAdmin()) {
            pages = pages.filter(page => page.published);
        }
        
        return pages.sort((a, b) => {
            // Trier par page d'accueil en premier, puis par ordre
            if (a.isHomepage) return -1;
            if (b.isHomepage) return 1;
            return (a.order || 999) - (b.order || 999);
        });
    } catch (error) {
        console.error("Error in getAllPages:", error);
        return [];
    }
};

// Obtenir une page par son slug
const getPageBySlug = async (slug: string): Promise<PageContent | null> => {
    try {
        const pages = await dbService.getAllItems<PageContent>("cmsPages");
        const page = pages.find(p => p.slug === slug);
        
        if (!page) {
            return null;
        }
        
        // Vérifier si la page est publiée ou si l'utilisateur est admin
        if (!page.published && !authService.isAdmin()) {
            return null;
        }
        
        return page;
    } catch (error) {
        console.error(`Error in getPageBySlug for slug ${slug}:`, error);
        return null;
    }
};

// Obtenir une page par son ID
const getPageById = async (id: string): Promise<PageContent | null> => {
    try {
        const page = await dbService.getItemById<PageContent>("cmsPages", id);
        
        if (!page) {
            return null;
        }
        
        // Vérifier si la page est publiée ou si l'utilisateur est admin
        if (!page.published && !authService.isAdmin()) {
            return null;
        }
        
        return page;
    } catch (error) {
        console.error(`Error in getPageById for ID ${id}:`, error);
        return null;
    }
};

// ===== FONCTIONS D'ADMINISTRATION =====

// Créer une nouvelle page (admin uniquement)
const createPage = async (
    title: string,
    slug: string,
    content: string,
    options: {
        metaTitle?: string;
        metaDescription?: string;
        published?: boolean;
        template?: string;
        order?: number;
        parent?: string;
        type?: PageContent['type'];
        isHomepage?: boolean;
    } = {}
): Promise<PageContent> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        // Vérifier si le slug existe déjà
        const existingPages = await dbService.getAllItems<PageContent>("cmsPages");
        if (existingPages.some(p => p.slug === slug)) {
            throw new Error("Ce slug existe déjà. Veuillez en choisir un autre.");
        }
        
        const now = new Date();
        
        // Créer la page
        const newPage: PageContent = {
            id: `page_${Date.now()}`,
            title,
            slug,
            content,
            metaTitle: options.metaTitle || title,
            metaDescription: options.metaDescription,
            published: options.published !== undefined ? options.published : false,
            createdAt: now,
            updatedAt: now,
            publishedAt: options.published ? now : undefined,
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
            template: options.template,
            order: options.order,
            parent: options.parent,
            type: options.type || 'page',
            isHomepage: options.isHomepage || false
        };
        
        // Si cette page est définie comme page d'accueil, mettre à jour les autres pages
        if (newPage.isHomepage) {
            for (const page of existingPages) {
                if (page.isHomepage) {
                    await dbService.updateItem("cmsPages", {
                        ...page,
                        isHomepage: false,
                        updatedAt: now,
                        updatedBy: currentUser.id
                    });
                }
            }
        }
        
        await dbService.addItem("cmsPages", newPage);
        
        // Créer la première révision
        await createPageRevision(newPage.id, newPage);
        
        return newPage;
    } catch (error) {
        console.error(`Error in createPage for title ${title}:`, error);
        throw error;
    }
};

// Mettre à jour une page (admin uniquement)
const updatePage = async (
    id: string,
    updates: Partial<Omit<PageContent, 'id' | 'createdAt' | 'createdBy'>>
): Promise<PageContent> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        const page = await dbService.getItemById<PageContent>("cmsPages", id);
        
        if (!page) {
            throw new Error("Page non trouvée");
        }
        
        // Vérifier si le slug a changé et s'il existe déjà
        if (updates.slug && updates.slug !== page.slug) {
            const existingPages = await dbService.getAllItems<PageContent>("cmsPages");
            if (existingPages.some(p => p.slug === updates.slug && p.id !== id)) {
                throw new Error("Ce slug existe déjà. Veuillez en choisir un autre.");
            }
        }
        
        const now = new Date();
        
        // Préparer les mises à jour
        const updatedPage: PageContent = {
            ...page,
            ...updates,
            updatedAt: now,
            updatedBy: currentUser.id,
            publishedAt: (updates.published && !page.published) ? now : page.publishedAt
        };
        
        // Si cette page est définie comme page d'accueil, mettre à jour les autres pages
        if (updates.isHomepage && !page.isHomepage) {
            const existingPages = await dbService.getAllItems<PageContent>("cmsPages");
            for (const p of existingPages) {
                if (p.isHomepage && p.id !== id) {
                    await dbService.updateItem("cmsPages", {
                        ...p,
                        isHomepage: false,
                        updatedAt: now,
                        updatedBy: currentUser.id
                    });
                }
            }
        }
        
        await dbService.updateItem("cmsPages", updatedPage);
        
        // Créer une nouvelle révision si le contenu a changé
        if (updates.content && updates.content !== page.content) {
            await createPageRevision(id, updatedPage);
        }
        
        return updatedPage;
    } catch (error) {
        console.error(`Error in updatePage for ID ${id}:`, error);
        throw error;
    }
};

// Supprimer une page (admin uniquement)
const deletePage = async (id: string): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const page = await dbService.getItemById<PageContent>("cmsPages", id);
        
        if (!page) {
            return false;
        }
        
        // Supprimer la page
        await dbService.deleteItem("cmsPages", id);
        
        // Supprimer également toutes les révisions associées
        const revisions = await getPageRevisions(id);
        for (const revision of revisions) {
            await dbService.deleteItem("cmsRevisions", revision.id);
        }
        
        return true;
    } catch (error) {
        console.error(`Error in deletePage for ID ${id}:`, error);
        return false;
    }
};

// Publier/dépublier une page (admin uniquement)
const togglePagePublished = async (id: string, publish: boolean): Promise<PageContent> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        const page = await dbService.getItemById<PageContent>("cmsPages", id);
        
        if (!page) {
            throw new Error("Page non trouvée");
        }
        
        const now = new Date();
        
        // Mettre à jour le statut de publication
        const updatedPage: PageContent = {
            ...page,
            published: publish,
            updatedAt: now,
            updatedBy: currentUser.id,
            publishedAt: publish ? now : page.publishedAt
        };
        
        await dbService.updateItem("cmsPages", updatedPage);
        
        return updatedPage;
    } catch (error) {
        console.error(`Error in togglePagePublished for ID ${id}:`, error);
        throw error;
    }
};

// ===== GESTION DES RÉVISIONS =====

// Créer une révision de page (interne)
const createPageRevision = async (
    pageId: string,
    page: PageContent
): Promise<PageRevision> => {
    try {
        // Obtenir le numéro de la prochaine révision
        const existingRevisions = await getPageRevisions(pageId);
        const revisionNumber = existingRevisions.length + 1;
        
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        // Créer la révision
        const newRevision: PageRevision = {
            id: `revision_${Date.now()}`,
            pageId,
            revisionNumber,
            title: page.title,
            content: page.content,
            metaTitle: page.metaTitle,
            metaDescription: page.metaDescription,
            createdAt: new Date(),
            createdBy: currentUser.id
        };
        
        await dbService.addItem("cmsRevisions", newRevision);
        
        return newRevision;
    } catch (error) {
        console.error(`Error in createPageRevision for page ${pageId}:`, error);
        throw error;
    }
};

// Obtenir toutes les révisions d'une page
const getPageRevisions = async (pageId: string): Promise<PageRevision[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        // Récupérer toutes les révisions de cette page
        const allRevisions = await dbService.getAllItems<PageRevision>("cmsRevisions");
        return allRevisions
            .filter(revision => revision.pageId === pageId)
            .sort((a, b) => b.revisionNumber - a.revisionNumber);
    } catch (error) {
        console.error(`Error in getPageRevisions for page ${pageId}:`, error);
        return [];
    }
};

// Restaurer une ancienne révision (admin uniquement)
const restorePageRevision = async (revisionId: string): Promise<PageContent> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        const revision = await dbService.getItemById<PageRevision>("cmsRevisions", revisionId);
        
        if (!revision) {
            throw new Error("Révision non trouvée");
        }
        
        const page = await dbService.getItemById<PageContent>("cmsPages", revision.pageId);
        
        if (!page) {
            throw new Error("Page non trouvée");
        }
        
        const now = new Date();
        
        // Mettre à jour la page avec le contenu de la révision
        const updatedPage: PageContent = {
            ...page,
            title: revision.title,
            content: revision.content,
            metaTitle: revision.metaTitle,
            metaDescription: revision.metaDescription,
            updatedAt: now,
            updatedBy: currentUser.id
        };
        
        await dbService.updateItem("cmsPages", updatedPage);
        
        // Mettre à jour la révision pour indiquer la restauration
        const updatedRevision: PageRevision = {
            ...revision,
            restoredAt: now,
            restoredBy: currentUser.id
        };
        
        await dbService.updateItem("cmsRevisions", updatedRevision);
        
        // Créer une nouvelle révision pour la version restaurée
        await createPageRevision(page.id, updatedPage);
        
        return updatedPage;
    } catch (error) {
        console.error(`Error in restorePageRevision for revision ${revisionId}:`, error);
        throw error;
    }
};

// ===== GESTION DES COMPOSANTS =====

// Obtenir tous les composants
const getAllComponents = async (activeOnly: boolean = true): Promise<CMSComponent[]> => {
    try {
        let components = await dbService.getAllItems<CMSComponent>("cmsComponents");
        
        if (activeOnly && !authService.isAdmin()) {
            components = components.filter(component => component.isActive);
        }
        
        return components;
    } catch (error) {
        console.error("Error in getAllComponents:", error);
        return [];
    }
};

// Créer un nouveau composant (admin uniquement)
const createComponent = async (
    name: string,
    type: CMSComponent['type'],
    content: any,
    settings?: any
): Promise<CMSComponent> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        const now = new Date();
        
        // Créer le composant
        const newComponent: CMSComponent = {
            id: `component_${Date.now()}`,
            name,
            type,
            content,
            settings,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: currentUser.id,
            updatedBy: currentUser.id
        };
        
        await dbService.addItem("cmsComponents", newComponent);
        
        return newComponent;
    } catch (error) {
        console.error(`Error in createComponent for name ${name}:`, error);
        throw error;
    }
};

// Mettre à jour un composant (admin uniquement)
const updateComponent = async (
    id: string,
    updates: Partial<Omit<CMSComponent, 'id' | 'createdAt' | 'createdBy'>>
): Promise<CMSComponent> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }
        
        const component = await dbService.getItemById<CMSComponent>("cmsComponents", id);
        
        if (!component) {
            throw new Error("Composant non trouvé");
        }
        
        // Mettre à jour le composant
        const updatedComponent: CMSComponent = {
            ...component,
            ...updates,
            updatedAt: new Date(),
            updatedBy: currentUser.id
        };
        
        await dbService.updateItem("cmsComponents", updatedComponent);
        
        return updatedComponent;
    } catch (error) {
        console.error(`Error in updateComponent for ID ${id}:`, error);
        throw error;
    }
};

// Supprimer un composant (admin uniquement)
const deleteComponent = async (id: string): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const component = await dbService.getItemById<CMSComponent>("cmsComponents", id);
        
        if (!component) {
            return false;
        }
        
        // Supprimer le composant
        await dbService.deleteItem("cmsComponents", id);
        
        return true;
    } catch (error) {
        console.error(`Error in deleteComponent for ID ${id}:`, error);
        return false;
    }
};

// ===== GESTION DES TEMPLATES =====

// Obtenir tous les templates
const getAllTemplates = async (activeOnly: boolean = true): Promise<CMSTemplate[]> => {
    try {
        let templates = await dbService.getAllItems<CMSTemplate>("cmsTemplates");
        
        if (activeOnly && !authService.isAdmin()) {
            templates = templates.filter(template => template.isActive);
        }
        
        return templates;
    } catch (error) {
        console.error("Error in getAllTemplates:", error);
        return [];
    }
};

// Créer un nouveau template (admin uniquement)
const createTemplate = async (
    name: string,
    structure: CMSTemplate['structure'],
    description?: string
): Promise<CMSTemplate> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const now = new Date();
        
        // Créer le template
        const newTemplate: CMSTemplate = {
            id: `template_${Date.now()}`,
            name,
            description,
            structure,
            isActive: true,
            createdAt: now,
            updatedAt: now
        };
        
        await dbService.addItem("cmsTemplates", newTemplate);
        
        return newTemplate;
    } catch (error) {
        console.error(`Error in createTemplate for name ${name}:`, error);
        throw error;
    }
};

// Mettre à jour un template (admin uniquement)
const updateTemplate = async (
    id: string,
    updates: Partial<Omit<CMSTemplate, 'id' | 'createdAt'>>
): Promise<CMSTemplate> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const template = await dbService.getItemById<CMSTemplate>("cmsTemplates", id);
        
        if (!template) {
            throw new Error("Template non trouvé");
        }
        
        // Mettre à jour le template
        const updatedTemplate: CMSTemplate = {
            ...template,
            ...updates,
            updatedAt: new Date()
        };
        
        await dbService.updateItem("cmsTemplates", updatedTemplate);
        
        return updatedTemplate;
    } catch (error) {
        console.error(`Error in updateTemplate for ID ${id}:`, error);
        throw error;
    }
};

// Supprimer un template (admin uniquement)
const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }
        
        const template = await dbService.getItemById<CMSTemplate>("cmsTemplates", id);
        
        if (!template) {
            return false;
        }
        
        // Vérifier si des pages utilisent ce template
        const pages = await dbService.getAllItems<PageContent>("cmsPages");
        const pagesUsingTemplate = pages.filter(page => page.template === id);
        
        if (pagesUsingTemplate.length > 0) {
            throw new Error(`Ce template est utilisé par ${pagesUsingTemplate.length} page(s) et ne peut pas être supprimé.`);
        }
        
        // Supprimer le template
        await dbService.deleteItem("cmsTemplates", id);
        
        return true;
    } catch (error) {
        console.error(`Error in deleteTemplate for ID ${id}:`, error);
        throw error;
    }
};

// ===== INITIALISATION =====

// Initialiser les pages par défaut
const initDefaultPages = async (): Promise<void> => {
    try {
        const existingPages = await dbService.getAllItems<PageContent>("cmsPages");
        
        if (existingPages.length === 0) {
            console.log("Initializing default CMS pages...");
            
            const adminUser = {
                id: "admin_1",
                email: "admin@admin.com",
                firstName: "Admin",
                lastName: "System",
                role: "admin" as const
            };
            
            // Créer quelques pages par défaut
            const homePage: PageContent = {
                id: `page_${Date.now()}`,
                title: "Accueil",
                slug: "home",
                content: "<h1>Bienvenue chez Flora</h1><p>Découvrez notre sélection de fleurs fraîches et arrangements floraux.</p>",
                metaTitle: "Chez Flora - Fleurs fraîches et arrangements floraux",
                metaDescription: "Boutique en ligne de fleurs fraîches, bouquets et arrangements floraux pour toutes les occasions.",
                published: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                publishedAt: new Date(),
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                type: "page",
                isHomepage: true,
                order: 1
            };
            
            const aboutPage: PageContent = {
                id: `page_${Date.now() + 1}`,
                title: "À propos",
                slug: "about",
                content: "<h1>À propos de Chez Flora</h1><p>Chez Flora est une boutique de fleurs en ligne créée en 2020...</p>",
                metaTitle: "À propos de Chez Flora - Notre histoire",
                metaDescription: "Découvrez l'histoire de Chez Flora, notre équipe et notre passion pour les arrangements floraux.",
                published: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                publishedAt: new Date(),
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                type: "page",
                order: 2
            };
            
            const contactPage: PageContent = {
                id: `page_${Date.now() + 2}`,
                title: "Contact",
                slug: "contact",
                content: "<h1>Contactez-nous</h1><p>Notre équipe est à votre disposition pour toute question.</p><p>Email: contact@chezflora.com</p><p>Téléphone: 01 23 45 67 89</p>",
                metaTitle: "Contact - Chez Flora",
                metaDescription: "Contactez notre équipe pour toute question sur nos produits ou services.",
                published: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                publishedAt: new Date(),
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                type: "page",
                order: 3
            };
            
            // Ajouter les pages
            await dbService.addItem("cmsPages", homePage);
            await dbService.addItem("cmsPages", aboutPage);
            await dbService.addItem("cmsPages", contactPage);
            
            // Créer les révisions initiales
            await createPageRevision(homePage.id, homePage);
            await createPageRevision(aboutPage.id, aboutPage);
            await createPageRevision(contactPage.id, contactPage);
            
            console.log("Default CMS pages initialized!");
        }
    } catch (error) {
        console.error("Error in initDefaultPages:", error);
    }
};

export const cmsService = {
    // Pages
    getAllPages,
    getPageBySlug,
    getPageById,
    createPage,
    updatePage,
    deletePage,
    togglePagePublished,
    // Révisions
    getPageRevisions,
    restorePageRevision,
    // Composants
    getAllComponents,
    createComponent,
    updateComponent,
    deleteComponent,
    // Templates
    getAllTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    // Initialisation
    initDefaultPages
};