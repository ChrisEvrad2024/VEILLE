// src/services/cms-editor.service.ts
/**
 * Service pour gérer les fonctionnalités spécifiques à l'éditeur CMS
 * Fournit des méthodes utilitaires et des valeurs par défaut pour les composants
 */
export const cmsEditorService = {
    /**
     * Récupère les valeurs par défaut pour un type de composant spécifique
     * @param type Type de composant
     * @returns Objet contenant les valeurs par défaut de contenu et de paramètres
     */
    getComponentDefaults: (type: string): { content: any; settings: any } => {
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
                        textColor: "#ffffff",
                        overlay: true,
                        overlayOpacity: 0.4
                    }
                };

            case 'slider':
                return {
                    content: {
                        slides: [
                            {
                                title: "Collection printemps",
                                description: "Découvrez notre nouvelle collection",
                                image: "/assets/logo.jpeg",
                                buttonText: "Explorer",
                                buttonLink: "/collections/printemps"
                            },
                            {
                                title: "Livraison gratuite",
                                description: "Pour toute commande supérieure à 50€",
                                image: "/assets/logo.jpeg",
                                buttonText: "Commander",
                                buttonLink: "/catalog"
                            }
                        ]
                    },
                    settings: {
                        autoplay: true,
                        interval: 5000,
                        showDots: true,
                        showArrows: true,
                        fullWidth: true,
                        height: "medium",
                        animation: "fade"
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
                        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    },
                    settings: {
                        fullWidth: true,
                        layout: "horizontal",
                        rounded: true,
                        showBadge: true,
                        badgeText: "PROMO",
                        animateBadge: true,
                        shadow: true,
                        padding: "medium"
                    }
                };

            case 'text':
                return {
                    content: {
                        title: "Titre de la section",
                        subtitle: "",
                        text: "<p>Entrez votre texte ici...</p>",
                        alignment: "left"
                    },
                    settings: {
                        fullWidth: false,
                        backgroundColor: "transparent",
                        textColor: "#000000",
                        padding: true,
                        maxWidth: "lg"
                    }
                };

            case 'newsletter':
                return {
                    content: {
                        title: "Abonnez-vous à notre newsletter",
                        description: "Restez informé de nos dernières offres et actualités",
                        buttonText: "S'abonner",
                        placeholderText: "Votre adresse email",
                        termsText: "En vous inscrivant, vous acceptez de recevoir nos newsletters."
                    },
                    settings: {
                        layout: "stacked",
                        backgroundColor: "#f3f4f6",
                        textColor: "#000000",
                        buttonColor: "#10b981",
                        rounded: true,
                        shadow: false,
                        padding: "medium"
                    }
                };

            case 'image':
                return {
                    content: {
                        src: "/assets/logo.jpeg",
                        alt: "Image descriptive",
                        caption: ""
                    },
                    settings: {
                        fullWidth: false,
                        rounded: true,
                        shadow: false,
                        maxWidth: "md",
                        aspectRatio: "16/9",
                        objectFit: "cover"
                    }
                };

            case 'video':
                return {
                    content: {
                        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        title: "Vidéo",
                        description: ""
                    },
                    settings: {
                        fullWidth: false,
                        maxWidth: "lg",
                        aspectRatio: "16/9",
                        autoplay: false,
                        muted: true,
                        controls: true,
                        loop: false
                    }
                };

            case 'featured_products':
                return {
                    content: {
                        title: "Produits en vedette",
                        description: "Découvrez notre sélection de produits",
                        productIds: [],
                        viewAllLink: "/catalog",
                        viewAllText: "Voir tous les produits"
                    },
                    settings: {
                        count: 3,
                        columns: {
                            sm: 1,
                            md: 2,
                            lg: 3
                        },
                        showPrice: true,
                        showDescription: true,
                        showButton: true,
                        buttonText: "Ajouter au panier",
                        layout: "grid"
                    }
                };

            case 'testimonials':
                return {
                    content: {
                        title: "Ce que nos clients disent",
                        description: "Découvrez les témoignages de nos clients satisfaits",
                        testimonials: [
                            {
                                text: "Un service exceptionnel et des produits de qualité.",
                                author: "Marie Dupont",
                                role: "Cliente fidèle"
                            },
                            {
                                text: "Je recommande vivement cette entreprise pour son professionnalisme.",
                                author: "Jean Martin",
                                role: "Client depuis 2023"
                            }
                        ]
                    },
                    settings: {
                        layout: "grid",
                        slidesToShow: 1,
                        autoplay: true,
                        showDots: true,
                        backgroundColor: "#ffffff",
                        textColor: "#000000",
                        rounded: true,
                        shadow: true
                    }
                };

            case 'html':
                return {
                    content: {
                        html: "<div style='text-align: center;'><p>Insérez votre HTML personnalisé ici</p></div>"
                    },
                    settings: {
                        fullWidth: false,
                        maxWidth: "lg",
                        containerClass: ""
                    }
                };

            default:
                // Valeurs par défaut génériques pour tout type inconnu
                return {
                    content: {},
                    settings: {
                        fullWidth: false
                    }
                };
        }
    },

    /**
     * Génère un nouvel ID unique pour un composant
     * @param type Type de composant
     * @returns ID unique pour le composant
     */
    generateComponentId: (type: string): string => {
        return `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    },

    /**
     * Duplique un composant existant avec un nouvel ID
     * @param component Composant à dupliquer
     * @returns Nouveau composant dupliqué avec un ID unique
     */
    duplicateComponent: (component: any): any => {
        return {
            ...component,
            id: `${component.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        };
    },

    /**
     * Valide la structure d'un composant
     * @param component Composant à valider
     * @returns Booléen indiquant si le composant est valide
     */
    validateComponent: (component: any): boolean => {
        // Vérifier que le composant a les propriétés requises
        if (!component || !component.type || !component.id) {
            return false;
        }

        // Vérifier que le contenu et les paramètres sont des objets
        if (typeof component.content !== 'object' || typeof component.settings !== 'object') {
            return false;
        }

        return true;
    },

    /**
     * Récupère les templates prédéfinis pour les pages
     * @returns Liste des templates disponibles
     */
    getPageTemplates: (): Array<{
        id: string;
        name: string;
        description: string;
        components: any[];
    }> => {
        return [
            {
                id: 'template-homepage',
                name: 'Page d\'accueil',
                description: 'Template pour une page d\'accueil avec bannière, produits en vedette et témoignages',
                components: [
                    {
                        id: 'banner-template-1',
                        type: 'banner',
                        order: 0,
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
                        id: 'featured_products-template-1',
                        type: 'featured_products',
                        order: 10,
                        content: {
                            title: "Nos produits populaires",
                            description: "Découvrez notre sélection de produits les plus appréciés",
                            productIds: [],
                            viewAllLink: "/catalog",
                            viewAllText: "Voir tous les produits"
                        },
                        settings: {
                            count: 3,
                            columns: {
                                sm: 1,
                                md: 2,
                                lg: 3
                            },
                            showPrice: true,
                            showDescription: true,
                            showButton: true,
                            buttonText: "Ajouter au panier",
                            layout: "grid"
                        }
                    },
                    {
                        id: 'testimonials-template-1',
                        type: 'testimonials',
                        order: 20,
                        content: {
                            title: "Témoignages clients",
                            description: "Ce que nos clients disent de nous",
                            testimonials: [
                                {
                                    text: "Des fleurs magnifiques pour mon mariage, je recommande vivement !",
                                    author: "Sophie Martin",
                                    role: "Mariée comblée"
                                },
                                {
                                    text: "Service impeccable et livraison rapide, je suis très satisfait.",
                                    author: "Thomas Dubois",
                                    role: "Client fidèle"
                                }
                            ]
                        },
                        settings: {
                            layout: "grid",
                            slidesToShow: 2,
                            autoplay: false,
                            showDots: true,
                            backgroundColor: "#f8f9fa",
                            textColor: "#000000",
                            rounded: true,
                            shadow: true
                        }
                    }
                ]
            },
            {
                id: 'template-about',
                name: 'À propos',
                description: 'Template pour une page "À propos" avec présentation et valeurs',
                components: [
                    {
                        id: 'banner-template-2',
                        type: 'banner',
                        order: 0,
                        content: {
                            title: "Notre histoire",
                            subtitle: "Découvrez qui nous sommes et ce qui nous anime",
                            image: "https://images.unsplash.com/photo-1462530260150-c3b7c86a4faa?q=80&w=2069&auto=format&fit=crop",
                            buttonText: "",
                            buttonLink: ""
                        },
                        settings: {
                            fullWidth: true,
                            height: "medium",
                            textColor: "#ffffff"
                        }
                    },
                    {
                        id: 'text-template-2',
                        type: 'text',
                        order: 10,
                        content: {
                            title: "Notre passion",
                            subtitle: "Depuis 2016",
                            text: "<p>Fondée en 2016, Flowery Haven est née d'une passion pour l'art floral et le désir de créer des compositions uniques qui racontent une histoire. Notre équipe de fleuristes talentueux combine créativité et expertise pour transformer chaque événement en une expérience mémorable.</p><p>Nous sélectionnons avec soin des fleurs de qualité exceptionnelle, en privilégiant les producteurs locaux et les pratiques durables. Chaque création est réalisée avec amour et attention aux détails, pour vous offrir ce qu'il y a de meilleur.</p>",
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
                ]
            },
            {
                id: 'template-contact',
                name: 'Contact',
                description: 'Template pour une page de contact avec formulaire',
                components: [
                    {
                        id: 'banner-template-3',
                        type: 'banner',
                        order: 0,
                        content: {
                            title: "Contactez-nous",
                            subtitle: "Nous sommes à votre écoute",
                            image: "https://images.unsplash.com/photo-1559963110-71b394e7494d?q=80&w=2070&auto=format&fit=crop",
                            buttonText: "",
                            buttonLink: ""
                        },
                        settings: {
                            fullWidth: true,
                            height: "small",
                            textColor: "#ffffff"
                        }
                    },
                    {
                        id: 'html-template-3',
                        type: 'html',
                        order: 10,
                        content: {
                            html: `<div style="display: flex; flex-wrap: wrap; gap: 2rem; justify-content: center; margin: 2rem 0;">
                  <div style="flex: 1 1 300px;">
                    <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Informations</h3>
                    <p><strong>Adresse:</strong> 123 Rue des Fleurs, 75001 Paris</p>
                    <p><strong>Téléphone:</strong> 01 23 45 67 89</p>
                    <p><strong>Email:</strong> contact@floweryhaven.com</p>
                    <p><strong>Horaires:</strong><br>Lundi - Vendredi: 9h à 19h<br>Samedi: 10h à 18h<br>Dimanche: Fermé</p>
                  </div>
                  <div style="flex: 1 1 300px;">
                    <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Formulaire de contact</h3>
                    <form style="display: flex; flex-direction: column; gap: 1rem;">
                      <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Nom</label>
                        <input type="text" placeholder="Votre nom" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem;">
                      </div>
                      <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Email</label>
                        <input type="email" placeholder="Votre email" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem;">
                      </div>
                      <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Message</label>
                        <textarea rows="5" placeholder="Votre message" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.25rem;"></textarea>
                      </div>
                      <button type="button" style="background-color: #10b981; color: white; padding: 0.75rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">Envoyer</button>
                    </form>
                  </div>
                </div>`
                        },
                        settings: {
                            fullWidth: false,
                            maxWidth: "lg",
                            containerClass: ""
                        }
                    }
                ]
            }
        ];
    }
};

export default cmsEditorService;