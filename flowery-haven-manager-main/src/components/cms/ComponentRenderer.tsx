// src/components/cms/ComponentRenderer.tsx
import React from "react";
import componentMapping from "./component-mapping";

// Interface pour les propriétés
interface ComponentRendererProps {
  type: string;
  content: any;
  settings: any;
}

/**
 * Composant qui rend dynamiquement un composant CMS en fonction de son type
 */
const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  type,
  content,
  settings,
}) => {
  // Récupère le composant correspondant au type
  const Component = componentMapping[type];

  // Si le type de composant n'est pas supporté, affiche un message d'erreur
  if (!Component) {
    console.warn(`Type de composant non supporté: ${type}`);

    // En production, on pourrait simplement retourner null pour ne pas afficher d'erreur aux utilisateurs
    if (process.env.NODE_ENV === "production") {
      return null;
    }

    // En développement, affiche un message d'erreur
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded my-4">
        <h3 className="font-bold">Composant non supporté</h3>
        <p>Le type de composant "{type}" n'est pas implémenté.</p>
      </div>
    );
  }

  // Rend le composant avec les props appropriées
  return <Component content={content} settings={settings} />;
};

export default ComponentRenderer;
