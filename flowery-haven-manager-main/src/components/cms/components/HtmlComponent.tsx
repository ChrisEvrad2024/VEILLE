// src/components/cms/components/HtmlComponent.tsx
import React from "react";
import { ComponentProps } from "../component-mapping";

/**
 * Composant pour afficher du contenu HTML brut depuis le CMS
 */
const HtmlComponent: React.FC<ComponentProps> = ({ content, settings }) => {
  // Extraire le contenu HTML
  const html = content.html || "";

  // Extraire les paramètres
  const { fullWidth = false, padding = true, containerClass = "" } = settings;

  return (
    <div
      className={`html-component ${
        fullWidth ? "w-full" : "container mx-auto"
      } ${containerClass}`}
    >
      <div className={`${padding ? "p-4" : ""}`}>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
};

export default HtmlComponent;
