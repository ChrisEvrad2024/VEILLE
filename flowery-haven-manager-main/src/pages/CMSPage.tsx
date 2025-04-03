// src/pages/CMSPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cmsFrontendService } from "@/services/cms-frontend.service";
import { PageContent } from "@/services/cms.service";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import { Helmet } from "react-helmet";

// Interface pour un composant dans le contenu CMS
interface PageComponent {
  id: string;
  type: string;
  content: any;
  settings: any;
  order: number;
}

const CMSPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageContent | null>(null);
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Charger la page par son slug
        const pageData = await cmsFrontendService.getPageBySlug(slug || "");

        if (!pageData) {
          setError("Page non trouvée");
          setIsLoading(false);
          return;
        }

        setPage(pageData);

        // Analyser le contenu de la page pour extraire les composants
        const pageComponents = parsePageComponents(pageData.content);
        
        // Charger les données de chaque composant
        const componentsPromises = pageComponents.map(async (comp) => {
          const componentData = await cmsFrontendService.getComponentData(comp.id, comp.data);
          return componentData ? {
            id: comp.id,
            type: componentData.type,
            content: componentData.content,
            settings: componentData.settings,
            order: comp.order
          } : null;
        });
        
        const loadedComponents = (await Promise.all(componentsPromises))
          .filter(comp => comp !== null)
          .sort((a, b) => (a!.order || 0) - (b!.order || 0));
        
        setComponents(loadedComponents as PageComponent[]);
      } catch (error) {
        console.error("Error loading CMS page:", error);
        setError("Erreur lors du chargement de la page");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadPage();
    }
  }, [slug, navigate]);

  // Fonction pour analyser le contenu de la page et extraire les références aux composants
  const parsePageComponents = (content: string) => {
    const components: Array<{ id: string; data?: any; order: number }> = [];
    
    try {
      // Rechercher les balises de composant dans le contenu
      // Format attendu: <!-- component:ID:ORDER:DATA -->
      const regex = /<!--\s*component:([\w-]+):(\d+)(?::(.*?))?\s*-->/g;
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const [, id, orderStr, dataStr] = match;
        const order = parseInt(orderStr, 10);
        
        let data = undefined;
        if (dataStr) {
          try {
            data = JSON.parse(dataStr);
          } catch (e) {
            console.warn(`Invalid JSON data for component ${id}:`, e);
          }
        }
        
        components.push({ id, data, order });
      }
    } catch (error) {
      console.error("Error parsing page components:", error);
    }
    
    return components;
  };

  // Rendu HTML du contenu
  const renderHtmlContent = (content: string) => {
    // Supprimer les balises de composant pour l'affichage HTML
    const cleanContent = content.replace(/<!--\s*component:[^>]*-->/g, '');
    return { __html: cleanContent };
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-16 min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Chargement de la page...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !page) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-16 min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Page non trouvée</h1>
            <p className="text-lg text-muted-foreground mb-8">
              {error || "La page que vous recherchez n'existe pas ou n'est pas disponible."}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.metaTitle || page.title}</title>
        {page.metaDescription && <meta name="description" content={page.metaDescription} />}
      </Helmet>

      <Navbar />

      <main className="min-h-[50vh]">
        {/* Titre de la page (optionnel - peut être masqué si inclus dans un composant) */}
        <div className="container mx-auto pt-10 pb-6">
          <h1 className="text-4xl font-bold">{page.title}</h1>
        </div>

        {/* Contenu HTML */}
        {page.content && (
          <div className="container mx-auto py-6">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={renderHtmlContent(page.content)} 
            />
          </div>
        )}

        {/* Composants CMS */}
        {components.length > 0 && (
          <div className="cms-components py-6">
            {components.map((component, index) => (
              <div key={`${component.id}-${index}`} className="cms-component-wrapper my-6">
                <ComponentRenderer 
                  type={component.type} 
                  content={component.content} 
                  settings={component.settings} 
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
};

export default CMSPage;