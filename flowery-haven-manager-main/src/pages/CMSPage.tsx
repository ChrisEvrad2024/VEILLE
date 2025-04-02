// src/pages/CMSPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cmsFrontendService } from "@/services/cms-frontend.service";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import { Helmet } from "react-helmet"; // Pour gérer les métadonnées SEO

// Interface pour les composants intégrés dans le contenu
interface EmbeddedComponent {
  id: string;
  type: string;
  content: any;
  settings: any;
}

const CMSPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [contentComponents, setContentComponents] = useState<
    EmbeddedComponent[]
  >([]);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError(null);

      try {
        // Si aucun slug n'est fourni ou si c'est la racine, charge la page d'accueil
        const pageSlug = !slug || slug === "/" ? "home" : slug;

        // Récupère la page depuis le service
        const page = await cmsFrontendService.getPageBySlug(pageSlug);

        if (!page) {
          setError("Page non trouvée");
          setLoading(false);
          return;
        }

        setPageTitle(page.title);
        setMetaTitle(page.metaTitle || page.title);
        setMetaDescription(page.metaDescription || "");

        // Analyse le contenu de la page pour trouver les composants intégrés
        // Ce code dépend de la structure de votre contenu - à adapter selon vos besoins
        const components: EmbeddedComponent[] = [];

        // Si le contenu est un simple HTML, on le traite comme un composant "html"
        if (typeof page.content === "string") {
          components.push({
            id: "content-html",
            type: "html",
            content: { html: page.content },
            settings: { fullWidth: false },
          });
        }
        // Si le contenu est un objet JSON avec des composants
        else if (typeof page.content === "object" && page.content) {
          // Si c'est un tableau de composants
          if (Array.isArray(page.content)) {
            page.content.forEach((comp, index) => {
              if (comp.type && (comp.content || comp.settings)) {
                components.push({
                  id: `embedded-${index}`,
                  type: comp.type,
                  content: comp.content || {},
                  settings: comp.settings || {},
                });
              }
            });
          }
          // Si c'est un objet avec des sections de composants
          else if (page.content.components) {
            const pageComponents = Array.isArray(page.content.components)
              ? page.content.components
              : [page.content.components];

            pageComponents.forEach((comp, index) => {
              if (comp.type) {
                components.push({
                  id: comp.id || `component-${index}`,
                  type: comp.type,
                  content: comp.content || {},
                  settings: comp.settings || {},
                });
              }
            });
          }
        }

        setContentComponents(components);
      } catch (err) {
        console.error("Erreur lors du chargement de la page:", err);
        setError("Une erreur est survenue lors du chargement de la page");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  // Affichage durant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
        <p className="text-gray-600 mb-6">
          Désolé, la page demandée n'est pas disponible.
        </p>
        <button
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          onClick={() => navigate("/")}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Gestion des métadonnées SEO */}
      <Helmet>
        <title>{metaTitle}</title>
        {metaDescription && (
          <meta name="description" content={metaDescription} />
        )}
      </Helmet>

      <div className="cms-page">
        {/* Rendre chaque composant identifié dans le contenu */}
        {contentComponents.map((component) => (
          <div key={component.id} className="mb-8">
            <ComponentRenderer
              type={component.type}
              content={component.content}
              settings={component.settings}
            />
          </div>
        ))}

        {/* Afficher un message si aucun composant n'est trouvé */}
        {contentComponents.length === 0 && (
          <div className="container mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>
            <p className="text-gray-600">
              Cette page n'a pas encore de contenu.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CMSPage;
