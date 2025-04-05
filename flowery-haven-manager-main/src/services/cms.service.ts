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
    type: 'banner' | 'slider' | 'featured_products' | 'newsletter' | 'testimonials' | 'text' | 'image' | 'video' | 'html' | 'custom' | 'promotion';
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
        try {
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
    } catch (error) {
        console.error("Erreur dans createPage:", error);
        throw error; // Important de propager l'erreur
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


const initHomePage = async (): Promise<void> => {
    try {
        console.log("Initialisation automatique de la page d'accueil désactivée");
        // const existingPages = await dbService.getAllItems<PageContent>("cmsPages");
        // const homePage = existingPages.find(page => page.isHomepage);

        // // Si une page d'accueil existe déjà et a du contenu, ne pas la remplacer
        // if (homePage && homePage.content && homePage.content.length > 50) {
        //     console.log("Une page d'accueil avec du contenu existe déjà");
        //     return;
        // }

        console.log("Initialisation de la page d'accueil avec des composants...");

        const adminUser = {
            id: "admin_1",
            email: "admin@admin.com",
            firstName: "Admin",
            lastName: "System",
            role: "admin" as const
        };

        // Contenu moderne pour la page d'accueil avec des composants
        const homePageContent = {
            components: [
                {
                    id: "banner-1",
                    type: "banner",
                    content: {
                        title: "Bienvenue chez Flowery Haven",
                        subtitle: "Des fleurs qui racontent votre histoire",
                        image: "https://images.unsplash.com/photo-1523694576729-787d637408d9?q=80&w=1974&auto=format&fit=crop",
                        buttonText: "Découvrir nos collections",
                        buttonLink: "/collections"
                    },
                    settings: {
                        fullWidth: true,
                        height: "large",
                        textColor: "#ffffff"
                    }
                },
                {
                    id: "promotion-1",
                    type: "promotion",
                    content: {
                        title: "Promotion de printemps",
                        subtitle: "Offre spéciale pour célébrer l'arrivée des beaux jours",
                        description: "Profitez de 20% de réduction sur toutes nos compositions florales printanières.",
                        image: "https://images.unsplash.com/photo-1558603668-6570496b8f18?q=80&w=1932&auto=format&fit=crop",
                        backgroundColor: "#ff6b6b",
                        textColor: "#ffffff",
                        ctaText: "En profiter",
                        ctaLink: "/promotions/printemps",
                        discount: "-20%",
                        expiryDate: "2025-06-30"
                    },
                    settings: {
                        fullWidth: true,
                        layout: "horizontal",
                        rounded: true,
                        showBadge: true,
                        badgeText: "PROMO",
                        animateBadge: true
                    }
                },
                {
                    id: "about-section",
                    type: "text",
                    content: {
                        title: "Notre histoire",
                        subtitle: "Passion & Savoir-faire",
                        text: "<p>Fondée en 2016, Flowery Haven est née d'une passion pour l'art floral et le désir de créer des compositions uniques qui racontent une histoire. Notre équipe de fleuristes talentueux combine créativité et expertise pour transformer chaque événement en une expérience mémorable.</p><p>Nous sélectionnons avec soin des fleurs de qualité exceptionnelle, en privilégiant les producteurs locaux et les pratiques durables. Chaque création est réalisée avec amour et attention aux détails, pour vous offrir ce qu'il y a de meilleur.</p>",
                        alignment: "left"
                    },
                    settings: {
                        fullWidth: false,
                        backgroundColor: "#f8f9fa",
                        textColor: "#212529",
                        padding: true,
                        maxWidth: "lg"
                    }
                },
                {
                    id: "newsletter-signup",
                    type: "newsletter",
                    content: {
                        title: "Restez informé",
                        description: "Inscrivez-vous à notre newsletter pour recevoir nos dernières offres et actualités",
                        buttonText: "S'abonner"
                    },
                    settings: {
                        layout: "stacked",
                        backgroundColor: "#e9ecef"
                    }
                }
            ]
        };

        const now = new Date();

        // Si une page d'accueil existe déjà, mettre à jour son contenu
        if (homePage) {
            const updatedHomePage = {
                ...homePage,
                content: JSON.stringify(homePageContent),
                updatedAt: now,
                updatedBy: adminUser.id
            };

            await dbService.updateItem("cmsPages", updatedHomePage);
            console.log("Page d'accueil mise à jour avec des composants modernes");
        } else {
            // Créer une nouvelle page d'accueil
            const newHomePage: PageContent = {
                id: `page_${Date.now()}`,
                title: "Accueil",
                slug: "home",
                content: JSON.stringify(homePageContent),
                metaTitle: "Flowery Haven - Fleurs fraîches et arrangements floraux",
                metaDescription: "Boutique en ligne de fleurs fraîches, bouquets et arrangements floraux pour toutes les occasions.",
                published: true,
                createdAt: now,
                updatedAt: now,
                publishedAt: now,
                createdBy: adminUser.id,
                updatedBy: adminUser.id,
                type: "page",
                isHomepage: true,
                order: 1
            };

            // Mettre à jour toutes les pages existantes pour ne plus être la page d'accueil
            for (const page of existingPages) {
                if (page.isHomepage) {
                    await dbService.updateItem("cmsPages", {
                        ...page,
                        isHomepage: false,
                        updatedAt: now,
                        updatedBy: adminUser.id
                    });
                }
            }

            await dbService.addItem("cmsPages", newHomePage);
            await createPageRevision(newHomePage.id, newHomePage);

            console.log("Nouvelle page d'accueil créée avec des composants modernes");
        }
    } catch (error) {
        console.error("Erreur lors de l'initialisation de la page d'accueil:", error);
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
        const uniqueId = `component_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        // Créer le composant
        const newComponent: CMSComponent = {
            id: uniqueId,
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
        // const existingPages = await dbService.getAllItems<PageContent>("cmsPages");

        // if (existingPages.length === 0) {
        //     console.log("Initializing default CMS pages...");

        //     // ... code existant pour créer les pages par défaut ...

        //     // Initialiser la page d'accueil avec des composants modernes
        //     await initHomePage();

        //     console.log("Default CMS pages initialized!");
        // } else {
        //     // Même si des pages existent, s'assurer que la page d'accueil est moderne
        //     await initHomePage();
        // }
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