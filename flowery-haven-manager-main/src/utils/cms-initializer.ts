// src/utils/cms-initializer.ts
import { cmsService, PageContent } from '@/services/cms.service';
import { cmsEditorService } from '@/services/cms-editor.service';

/**
 * Utilitaire pour initialiser le CMS manuellement
 * Permet de créer des pages prédéfinies et des composants
 */
export const cmsInitializer = {
    /**
     * Initialise toutes les pages par défaut
     * @returns True si l'initialisation est réussie, false sinon
     */
    initializeAll: async (): Promise<boolean> => {
        try {
            // Initialiser la page d'accueil
            await cmsInitializer.initializeHomePage();

            // Initialiser la page À propos
            await cmsInitializer.initializeAboutPage();

            // Initialiser la page Réalisations
            await cmsInitializer.initializeRealisationsPage();

            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation du CMS:", error);
            return false;
        }
    },

    /**
     * Initialise uniquement la page d'accueil
     * @returns True si l'initialisation est réussie, false sinon
     */
    initializeHomePage: async (): Promise<boolean> => {
        try {
            // Vérifier si une page d'accueil existe déjà
            const existingPages = await cmsService.getAllPages(true);
            const homePage = existingPages.find(page => page.isHomepage);
            const homeSlugPage = existingPages.find(page => page.slug === "home");

            // Préparer le contenu de la page
            const pageContent = {
                title: "Accueil",
                content: "",
                metaTitle: "Flowery Haven - Fleurs fraîches et arrangements floraux",
                metaDescription: "Boutique en ligne de fleurs fraîches, bouquets et arrangements floraux pour toutes les occasions.",
                published: true,
                type: "page" as PageContent["type"],
                isHomepage: true
            };

            // Obtenir le template d'accueil
            const homeTemplate = cmsEditorService.getPageTemplates().find(t => t.id === 'template-homepage');
            if (!homeTemplate) {
                console.error("Template d'accueil non trouvé");
                return false;
            }

            // Générer le contenu avec les composants
            const templateComponents = homeTemplate.components;
            let content = "";

            templateComponents.forEach(component => {
                const componentData = {
                    content: component.content,
                    settings: component.settings
                };

                content += `\n<!-- component:${component.id}:${component.order}:${JSON.stringify(componentData)} -->`;
            });

            // Si une page d'accueil existe déjà, la mettre à jour
            if (homePage) {
                console.log(`Page d'accueil existante trouvée (ID: ${homePage.id})`);
                
                try {
                    // Ne pas essayer de changer le slug lors de la mise à jour
                    // mais conserver celui qui existe déjà
                    await cmsService.updatePage(homePage.id, {
                        ...pageContent,
                        slug: homePage.slug, // Garder le slug actuel
                        content
                    });
                    console.log(`Page d'accueil mise à jour avec succès (slug conservé: ${homePage.slug})`);
                } catch (updateError) {
                    console.error("Erreur lors de la mise à jour de la page d'accueil:", updateError);
                    // Une tentative alternative sans modifier le contenu
                    try {
                        await cmsService.updatePage(homePage.id, {
                            title: pageContent.title,
                            metaTitle: pageContent.metaTitle,
                            metaDescription: pageContent.metaDescription,
                            published: pageContent.published,
                            isHomepage: pageContent.isHomepage
                        });
                        console.log("Page d'accueil mise à jour partiellement (sans contenu)");
                    } catch (fallbackError) {
                        console.error("Échec de la mise à jour partielle de la page d'accueil:", fallbackError);
                    }
                }
            } 
            // Si une page avec le slug 'home' existe mais n'est pas marquée comme page d'accueil
            else if (homeSlugPage) {
                console.log(`Une page avec le slug 'home' existe déjà (ID: ${homeSlugPage.id}). Mise à jour pour en faire la page d'accueil.`);
                
                try {
                    await cmsService.updatePage(homeSlugPage.id, {
                        ...pageContent,
                        slug: homeSlugPage.slug, // Garder le slug actuel
                        content,
                        isHomepage: true
                    });
                    console.log(`Page existante mise à jour et définie comme page d'accueil (slug: ${homeSlugPage.slug})`);
                } catch (updateError) {
                    console.error("Erreur lors de la mise à jour de la page avec slug 'home':", updateError);
                }
            } 
            // Sinon, créer une nouvelle page d'accueil
            else {
                // Générer un slug unique pour éviter les collisions
                const uniqueSlug = `home-${Date.now()}`;
                
                try {
                    // Créer une nouvelle page
                    const newPage = await cmsService.createPage(
                        pageContent.title,
                        uniqueSlug, // Utiliser un slug unique
                        content,
                        {
                            metaTitle: pageContent.metaTitle,
                            metaDescription: pageContent.metaDescription,
                            published: pageContent.published,
                            type: pageContent.type,
                            isHomepage: pageContent.isHomepage
                        }
                    );

                    if (!newPage) {
                        console.error("Échec de création de la page d'accueil");
                        return false;
                    }

                    console.log(`Nouvelle page d'accueil créée avec succès (slug: ${uniqueSlug})`);
                } catch (createError) {
                    console.error("Erreur lors de la création de la page d'accueil:", createError);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation de la page d'accueil:", error);
            return false;
        }
    },

    /**
     * Initialise la page À propos
     * @returns True si l'initialisation est réussie, false sinon
     */
    initializeAboutPage: async (): Promise<boolean> => {
        try {
            // Vérifier si la page existe déjà
            const existingPages = await cmsService.getAllPages(true);
            const aboutPage = existingPages.find(page => page.slug === "about");

            // Préparer le contenu de la page
            const pageContent = {
                title: "À propos",
                content: "",
                metaTitle: "À propos de Flowery Haven - Notre histoire et nos valeurs",
                metaDescription: "Découvrez l'histoire de Flowery Haven, notre passion pour l'art floral et notre engagement envers la qualité et le développement durable.",
                published: true,
                type: "page" as PageContent["type"],
                isHomepage: false
            };

            // Obtenir le template
            const aboutTemplate = cmsEditorService.getPageTemplates().find(t => t.id === 'template-about');
            if (!aboutTemplate) {
                console.error("Template À propos non trouvé");
                return false;
            }

            // Générer le contenu avec les composants
            const templateComponents = aboutTemplate.components;
            let content = "";

            templateComponents.forEach(component => {
                const componentData = {
                    content: component.content,
                    settings: component.settings
                };

                content += `\n<!-- component:${component.id}:${component.order}:${JSON.stringify(componentData)} -->`;
            });

            // Si la page existe déjà, la mettre à jour
            if (aboutPage) {
                try {
                    await cmsService.updatePage(aboutPage.id, {
                        ...pageContent,
                        slug: aboutPage.slug, // Conserver le slug existant
                        content
                    });
                    console.log(`Page À propos mise à jour avec succès (slug: ${aboutPage.slug})`);
                } catch (updateError) {
                    console.error("Erreur lors de la mise à jour de la page À propos:", updateError);
                }
            } else {
                // Créer une nouvelle page avec un slug unique
                const uniqueSlug = `about-${Date.now()}`;
                
                try {
                    const newPage = await cmsService.createPage(
                        pageContent.title,
                        uniqueSlug, // Utiliser un slug unique
                        content,
                        {
                            metaTitle: pageContent.metaTitle,
                            metaDescription: pageContent.metaDescription,
                            published: pageContent.published,
                            type: pageContent.type,
                            isHomepage: pageContent.isHomepage
                        }
                    );

                    if (!newPage) {
                        console.error("Échec de création de la page À propos");
                        return false;
                    }

                    console.log(`Nouvelle page À propos créée avec succès (slug: ${uniqueSlug})`);
                } catch (createError) {
                    console.error("Erreur lors de la création de la page À propos:", createError);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation de la page À propos:", error);
            return false;
        }
    },

    /**
     * Initialise la page Réalisations
     * @returns True si l'initialisation est réussie, false sinon
     */
    initializeRealisationsPage: async (): Promise<boolean> => {
        try {
            // Vérifier si la page existe déjà
            const existingPages = await cmsService.getAllPages(true);
            const realisationsPage = existingPages.find(page => page.slug === "realisations");

            // Préparer le contenu de la page avec des sections commentaires
            const pageContent = {
                title: "Nos Réalisations",
                content: "",
                metaTitle: "Nos Réalisations - Projets floraux et événements",
                metaDescription: "Découvrez nos créations florales pour des événements uniques et prestigieux. Chaque projet raconte une histoire et reflète notre passion pour l'art floral.",
                published: true,
                type: "page" as PageContent["type"],
                isHomepage: false
            };

            // Créer des composants spécifiques pour la page Réalisations
            const components = [
                {
                    id: `testimonials-realisations-${Date.now()}`,
                    type: 'testimonials',
                    order: 10,
                    content: {
                        title: "Témoignages de nos clients",
                        description: "Découvrez ce que nos clients disent de nos réalisations",
                        testimonials: [
                            {
                                text: "ChezFlora a transformé notre mariage en un véritable conte de fées floral. Les compositions étaient à couper le souffle et ont parfaitement reflété notre vision. Un grand merci à toute l'équipe pour leur talent et leur professionnalisme.",
                                author: "Marie et Pierre Durand",
                                role: "Mariage à Bordeaux"
                            },
                            {
                                text: "Pour l'inauguration de notre boutique, nous voulions créer une ambiance élégante et raffinée. ChezFlora a su capturer l'essence de notre marque à travers des arrangements floraux spectaculaires qui ont fait sensation auprès de nos invités.",
                                author: "Émilie Laurent",
                                role: "Directrice marketing, Maison de Beauté"
                            },
                            {
                                text: "Je fais appel à ChezFlora pour tous les événements d'entreprise que j'organise. Leur créativité, leur fiabilité et leur capacité à s'adapter à différents thèmes et budgets font d'eux un partenaire incontournable.",
                                author: "Thomas Moreau",
                                role: "Responsable événementiel, Groupe Horizon"
                            }
                        ]
                    },
                    settings: {
                        layout: "slider",
                        slidesToShow: 1,
                        autoplay: true,
                        showDots: true,
                        backgroundColor: "#f8f9fa",
                        textColor: "#000000",
                        rounded: true,
                        shadow: true
                    }
                },
                {
                    id: `slider-realisations-${Date.now()}`,
                    type: 'slider',
                    order: 20,
                    content: {
                        slides: [
                            {
                                title: "Mariage au Château des Vignes",
                                description: "Décoration florale complète pour un mariage de 150 invités",
                                image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070",
                                buttonText: "Voir le projet",
                                buttonLink: "/realisations"
                            },
                            {
                                title: "Gala de charité Lumière d'Espoir",
                                description: "Arrangements floraux pour 25 tables et décoration de salle",
                                image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1769",
                                buttonText: "Voir le projet",
                                buttonLink: "/realisations"
                            },
                            {
                                title: "Ouverture boutique Élégance",
                                description: "Création d'une ambiance luxueuse avec des compositions florales modernes",
                                image: "https://images.unsplash.com/photo-1561908858-91148bc208d9?q=80&w=1935",
                                buttonText: "Voir le projet",
                                buttonLink: "/realisations"
                            }
                        ]
                    },
                    settings: {
                        autoplay: true,
                        interval: 5000,
                        showDots: true,
                        showArrows: true,
                        fullWidth: true,
                        height: "large",
                        animation: "fade"
                    }
                },
                {
                    id: `text-realisations-${Date.now()}`,
                    type: 'text',
                    order: 0,
                    content: {
                        title: "Notre expertise en décoration événementielle",
                        subtitle: "Des créations florales pour tous vos moments importants",
                        text: "<p>ChezFlora vous propose des créations florales sur mesure pour tous vos événements, qu'il s'agisse d'un mariage, d'une inauguration d'entreprise, d'un gala ou d'une fête privée. Notre équipe de fleuristes passionnés travaille étroitement avec vous pour comprendre votre vision et créer des arrangements qui reflètent parfaitement l'atmosphère que vous souhaitez instaurer.</p><p>Nous accordons une attention particulière à chaque détail, de la sélection des fleurs les plus fraîches à la conception d'arrangements qui s'intègrent harmonieusement à votre espace. Parcourez notre galerie de réalisations pour vous inspirer et n'hésitez pas à nous contacter pour discuter de votre projet.</p>",
                        alignment: "center"
                    },
                    settings: {
                        fullWidth: false,
                        backgroundColor: "#ffffff",
                        textColor: "#000000",
                        padding: true,
                        maxWidth: "lg"
                    }
                }
            ];

            // Générer le contenu avec les composants
            let content = "";
            components.forEach(component => {
                const componentData = {
                    content: component.content,
                    settings: component.settings
                };

                content += `\n<!-- component:${component.id}:${component.order}:${JSON.stringify(componentData)} -->`;
            });

            // Si la page existe déjà, la mettre à jour
            if (realisationsPage) {
                try {
                    await cmsService.updatePage(realisationsPage.id, {
                        ...pageContent,
                        slug: realisationsPage.slug, // Conserver le slug existant
                        content
                    });
                    console.log(`Page Réalisations mise à jour avec succès (slug: ${realisationsPage.slug})`);
                } catch (updateError) {
                    console.error("Erreur lors de la mise à jour de la page Réalisations:", updateError);
                }
            } else {
                // Créer une nouvelle page avec un slug unique
                const uniqueSlug = `realisations-${Date.now()}`;
                
                try {
                    const newPage = await cmsService.createPage(
                        pageContent.title,
                        uniqueSlug, // Utiliser un slug unique
                        content,
                        {
                            metaTitle: pageContent.metaTitle,
                            metaDescription: pageContent.metaDescription,
                            published: pageContent.published,
                            type: pageContent.type,
                            isHomepage: pageContent.isHomepage
                        }
                    );

                    if (!newPage) {
                        console.error("Échec de création de la page Réalisations");
                        return false;
                    }

                    console.log(`Nouvelle page Réalisations créée avec succès (slug: ${uniqueSlug})`);
                } catch (createError) {
                    console.error("Erreur lors de la création de la page Réalisations:", createError);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation de la page Réalisations:", error);
            return false;
        }
    }
};

export default cmsInitializer;