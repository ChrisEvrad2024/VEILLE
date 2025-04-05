// src/pages/Realisations.tsx
import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cmsFrontendService } from "@/services/cms-frontend.service";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, DollarSign, Star, Users, Camera } from "lucide-react";

// Interface pour les composants CMS
interface EmbeddedComponent {
  id: string;
  type: string;
  content: any;
  settings: any;
}

// Interface pour les projets
interface Project {
  id: string;
  title: string;
  date: string;
  location: string;
  amount: string;
  description: string;
  category: string;
  images: string[];
  clientName?: string;
  testimonial?: string;
}

// Données factices de projets (à remplacer par des données réelles)
const dummyProjects: Project[] = [
  {
    id: "project-1",
    title: "Mariage champêtre au Domaine des Roses",
    date: "15 mars 2025",
    location: "Saint-Émilion, Bordeaux",
    amount: "3 500 €",
    description: "Décoration florale complète pour un mariage champêtre avec 120 invités. Arches florales, centres de table, bouquet de la mariée et boutonnières.",
    category: "mariage",
    images: [
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2070",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070",
      "https://images.unsplash.com/photo-1522673607200-164d1b3ce475?q=80&w=2070"
    ],
    clientName: "Sophie et Thomas",
    testimonial: "ChezFlora a transformé notre journée en un rêve floral. Chaque détail était parfait et les invités n'ont pas arrêté de complimenter les arrangements !"
  },
  {
    id: "project-2",
    title: "Inauguration boutique Élégance",
    date: "28 février 2025",
    location: "Quartier Marais, Paris",
    amount: "1 800 €",
    description: "Décoration florale pour l'inauguration d'une boutique de prêt-à-porter haut de gamme. Arrangements floraux modernes et élégants pour créer une ambiance luxueuse.",
    category: "événement commercial",
    images: [
      "https://images.unsplash.com/photo-1561908858-91148bc208d9?q=80&w=1935",
      "https://images.unsplash.com/photo-1613430344593-21da5f077c7a?q=80&w=1974",
    ],
    clientName: "Élégance Paris",
    testimonial: "Une prestation exceptionnelle qui a parfaitement complété l'identité de notre marque. Un vrai savoir-faire !"
  },
  {
    id: "project-3",
    title: "Gala annuel Fondation Espoir",
    date: "12 janvier 2025",
    location: "Palais des Congrès, Lyon",
    amount: "4 200 €",
    description: "Décoration florale pour un gala caritatif accueillant 200 personnes. Arrangements floraux pour 25 tables, podium et espaces d'accueil.",
    category: "événement caritatif",
    images: [
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1769",
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070",
    ],
    clientName: "Fondation Espoir",
    testimonial: "La décoration florale a apporté chaleur et élégance à notre événement. Un grand merci à toute l'équipe pour leur professionnalisme et leur créativité."
  }
];

// Catégories pour filtrer les projets
const categories = [
  "tous", "mariage", "événement commercial", "événement caritatif", "anniversaire", "autre"
];

const Realisations = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentComponents, setContentComponents] = useState<EmbeddedComponent[]>([]);
  const [projects, setProjects] = useState<Project[]>(dummyProjects);
  const [activeCategory, setActiveCategory] = useState("tous");
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);

  // Récupérer les composants CMS
  useEffect(() => {
    const loadCmsContent = async () => {
      setLoading(true);
      setError(null);

      try {
        // Essayer de charger la page "realisations" du CMS
        const page = await cmsFrontendService.getPageBySlug("realisations");

        if (page) {
          // Extraire les composants du contenu
          const pageComponents = cmsFrontendService.parsePageComponents(page.content);
          
          // Récupérer les données complètes de chaque composant
          const componentsPromises = pageComponents.map(async (comp) => {
            try {
              const componentData = await cmsFrontendService.getComponentData(comp.id, comp.options);
              if (!componentData) return null;
              
              return {
                id: comp.id,
                type: componentData.type,
                content: componentData.content,
                settings: componentData.settings
              };
            } catch (error) {
              console.error(`Erreur lors du chargement du composant ${comp.id}:`, error);
              return null;
            }
          });
          
          const loadedComponents = await Promise.all(componentsPromises);
          const validComponents = loadedComponents.filter((comp): comp is EmbeddedComponent => comp !== null);
          
          setContentComponents(validComponents);
        }
      } catch (err) {
        console.error("Erreur lors du chargement du contenu CMS:", err);
        setError("Une erreur est survenue lors du chargement du contenu");
      } finally {
        setLoading(false);
      }
    };

    loadCmsContent();
  }, []);

  // Filtrer les projets par catégorie
  useEffect(() => {
    if (activeCategory === "tous") {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter(project => project.category === activeCategory));
    }
  }, [activeCategory, projects]);

  // Formatage de la date
  const formatDate = (dateString: string) => {
    return dateString;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 pb-16">
        {/* Hero Section */}
        <section className="relative py-20 mb-12 bg-muted">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Nos Réalisations</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
              Découvrez nos créations florales pour des événements uniques et prestigieux.
              Chaque projet raconte une histoire et reflète notre passion pour l'art floral.
            </p>
          </div>
        </section>

        {/* Zone de composants CMS - Début */}
        {contentComponents.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="cms-content">
              {contentComponents.map((component) => (
                <div key={component.id} className="mb-12">
                  <ComponentRenderer
                    type={component.type}
                    content={component.content}
                    settings={component.settings}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
        {/* Zone de composants CMS - Fin */}

        {/* Section Derniers Projets */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-serif mb-8 text-center">Nos Derniers Projets</h2>
          
          {/* Filtres par catégorie */}
          <Tabs 
            defaultValue="tous" 
            className="w-full mb-8"
            value={activeCategory}
            onValueChange={setActiveCategory}
          >
            <TabsList className="flex justify-center flex-wrap">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Liste des projets */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden flex flex-col">
                <div className="h-64 overflow-hidden">
                  <img 
                    src={project.images[0]} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {project.category}
                    </Badge>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {formatDate(project.date)}
                    </div>
                  </div>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription className="flex flex-col gap-1 mt-2">
                    <span className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {project.location}
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      Budget: {project.amount}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>
                </CardContent>
                <CardFooter className="mt-auto">
                  {project.testimonial && (
                    <div className="w-full">
                      <div className="flex items-start gap-2 text-sm italic text-muted-foreground">
                        <Star className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="line-clamp-2">"{project.testimonial}"</p>
                      </div>
                      <div className="text-right text-sm font-medium mt-2">
                        — {project.clientName}
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-medium mb-2">Aucun projet trouvé</h3>
              <p className="text-muted-foreground">
                Aucun projet ne correspond à la catégorie sélectionnée.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveCategory("tous")}
              >
                Voir tous les projets
              </Button>
            </div>
          )}
        </section>

        {/* Section Contact */}
        <section className="bg-primary text-white py-16 mt-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif mb-4">Vous avez un projet en tête ?</h2>
            <p className="mb-8 max-w-2xl mx-auto">
              Nous serions ravis de vous accompagner dans la réalisation de votre événement.
              Contactez-nous pour discuter de votre projet et obtenir un devis personnalisé.
            </p>
            <Button asChild variant="secondary" size="lg">
              <a href="/contact">Demander un devis</a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Realisations;