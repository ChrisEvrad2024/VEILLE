// src/pages/Index.tsx
import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cmsFrontendService } from "@/services/cms-frontend.service";
import { PageContent } from "@/services/cms.service";
import ComponentRenderer from "@/components/cms/ComponentRenderer";

// Composants internes pour utilisation comme fallback
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";

// Interface pour les composants intégrés dans le contenu
interface EmbeddedComponent {
  id: string;
  type: string;
  content: any;
  settings: any;
}

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homePage, setHomePage] = useState<PageContent | null>(null);
  const [contentComponents, setContentComponents] = useState<EmbeddedComponent[]>([]);
  
  // Nouvelle approche: toujours afficher le contenu statique par défaut
  // sauf si explicitement désactivé
  const [showStaticContent, setShowStaticContent] = useState(true);

  useEffect(() => {
    const loadHomePage = async () => {
      setLoading(true);
      setError(null);

      try {
        // Récupérer la page d'accueil depuis le CMS
        const page = await cmsFrontendService.getHomePage();

        if (!page) {
          console.log("Aucune page d'accueil trouvée dans le CMS, utilisation du contenu de secours");
          setLoading(false);
          return;
        }

        setHomePage(page);

        // Analyse le contenu de la page pour trouver les composants intégrés
        const components: EmbeddedComponent[] = [];

        // Utiliser le service pour extraire les composants du contenu
        const pageComponents = cmsFrontendService.parsePageComponents(page.content);
        
        // Récupérer les données complètes de chaque composant
        if (pageComponents.length > 0) {
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
          
          // IMPORTANT: Modification ici - Ne désactivez pas le contenu statique
          // Si une configuration explicite existe dans le contenu de la page pour cacher le contenu statique
          if (page.content && page.content.includes('"hideStaticContent":true')) {
            setShowStaticContent(false);
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement de la page d'accueil:", err);
        setError("Une erreur est survenue lors du chargement de la page");
      } finally {
        setLoading(false);
      }
    };

    loadHomePage();
  }, []);

  // Contenu de secours (original)
  const renderStaticContent = () => (
    <>
      <Hero />

      <FeaturedProducts />

      {/* About section */}
      <section className="py-24 bg-muted">
        <div className="container max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <span className="inline-block text-xs uppercase tracking-widest mb-3 text-primary font-medium">
              Notre Histoire
            </span>
            <h2 className="section-title">Passion & Savoir-faire</h2>
            <p className="text-muted-foreground mb-6">
              Fondée en 2016, ChezFlora est née d'une passion pour l'art
              floral et le désir de créer des compositions uniques qui
              racontent une histoire. Notre équipe de fleuristes talentueux
              combine créativité et expertise pour transformer chaque
              événement en une expérience mémorable.
            </p>
            <p className="text-muted-foreground mb-8">
              Nous sélectionnons avec soin des fleurs de qualité
              exceptionnelle, en privilégiant les producteurs locaux et les
              pratiques durables. Chaque création est réalisée avec amour et
              attention aux détails, pour vous offrir ce qu'il y a de
              meilleur.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center text-primary hover:underline"
            >
              En savoir plus sur ChezFlora
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative">
              <div className="aspect-[4/3] rounded-lg overflow-hidden">
                <img
                  src="/assets/logo.jpeg"
                  alt="Fleuriste ChezFlora"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-white rounded-lg p-4 shadow-lg hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1592492152545-9695d3f473f4?q=80&w=1770"
                  alt="Détail floral"
                  className="w-full h-full object-cover rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services section */}
      <section className="section-container">
        <div className="text-center mb-16">
          <span className="inline-block text-xs uppercase tracking-widest mb-3 text-primary font-medium">
            Nos Services
          </span>
          <h2 className="section-title">Expertise Florale</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Découvrez notre gamme complète de services floraux, adaptés à tous
            vos besoins et occasions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-border text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <img
                src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1980"
                alt="Bouquets"
                className="w-10 h-10 object-cover rounded-full"
              />
            </div>
            <h3 className="font-serif text-xl mb-3">
              Bouquets Personnalisés
            </h3>
            <p className="text-muted-foreground mb-6">
              Créations florales uniques, confectionnées selon vos goûts et
              pour toutes les occasions.
            </p>
            <Link
              to="/catalog?category=bouquets"
              className="text-primary hover:underline inline-flex items-center"
            >
              Découvrir
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm border border-border text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <img
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1769"
                alt="Événements"
                className="w-10 h-10 object-cover rounded-full"
              />
            </div>
            <h3 className="font-serif text-xl mb-3">
              Décoration Événementielle
            </h3>
            <p className="text-muted-foreground mb-6">
              Des mariages aux événements d'entreprise, nous sublimerons votre
              espace avec des créations sur mesure.
            </p>
            <Link
              to="/contact"
              className="text-primary hover:underline inline-flex items-center"
            >
              Demander un devis
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm border border-border text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <img
                src="https://images.unsplash.com/photo-1524598171347-abf62dfd6694?q=80&w=1974"
                alt="Plantes"
                className="w-10 h-10 object-cover rounded-full"
              />
            </div>
            <h3 className="font-serif text-xl mb-3">Plantes d'Intérieur</h3>
            <p className="text-muted-foreground mb-6">
              Une sélection de plantes en pot pour agrémenter votre intérieur
              avec une touche de nature.
            </p>
            <Link
              to="/catalog?category=potted-plants"
              className="text-primary hover:underline inline-flex items-center"
            >
              Explorer
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-24 bg-primary text-white">
        <div className="container max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-6">
            Prêt à embellir votre espace ?
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Transformez votre intérieur ou votre événement avec nos créations
            florales uniques.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/catalog"
              className="bg-white text-primary rounded-md px-8 py-3 min-w-[180px] hover:bg-white/90 transition-all duration-300 hover:translate-y-[-2px]"
            >
              Découvrir la boutique
            </Link>
            <Link
              to="/contact"
              className="bg-transparent border border-white rounded-md px-8 py-3 min-w-[180px] hover:bg-white/10 transition-all duration-300 hover:translate-y-[-2px]"
            >
              Contactez-nous
            </Link>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <>
      <Navbar />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
          <p className="text-gray-600 mb-6">
            Désolé, la page demandée n'est pas disponible.
          </p>
          {renderStaticContent()}
        </div>
      ) : (
        <main>
          {/* Zone de composants CMS - Toujours affichée si présents */}
          {contentComponents.length > 0 && (
            <section className="cms-content mb-12">
              {contentComponents.map((component) => (
                <div key={component.id} className="mb-8">
                  <ComponentRenderer
                    type={component.type}
                    content={component.content}
                    settings={component.settings}
                  />
                </div>
              ))}
            </section>
          )}
          
          {/* Contenu statique - Affiché par défaut ou selon configuration */}
          {showStaticContent && renderStaticContent()}
        </main>
      )}

      <Footer />
    </>
  );
};

export default Index;