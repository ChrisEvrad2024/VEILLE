// src/components/cms/components/BannerComponent.tsx
import React from "react";
import { ComponentProps } from "../component-mapping";

const BannerComponent: React.FC<ComponentProps> = ({ content, settings }) => {
  // Extraire les valeurs du contenu avec des valeurs par défaut
  const {
    title = "",
    subtitle = "",
    image = "",
    buttonText = "",
    buttonLink = "",
  } = content;

  // Extraire les paramètres avec des valeurs par défaut
  const {
    fullWidth = true,
    height = "medium",
    textColor = "#ffffff",
  } = settings;

  // Déterminer la hauteur en fonction du paramètre
  const getHeightClass = () => {
    switch (height) {
      case "small":
        return "h-64";
      case "large":
        return "h-96";
      case "medium":
      default:
        return "h-80";
    }
  };

  return (
    <div
      className={`relative ${getHeightClass()} overflow-hidden ${
        fullWidth ? "w-full" : "max-w-6xl mx-auto"
      }`}
      style={{
        backgroundColor: image ? "transparent" : "#2a2a2a",
      }}
    >
      {/* Image d'arrière-plan (conditionnelle) */}
      {image && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
          }}
        >
          {/* Overlay sombre pour améliorer la lisibilité du texte */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
      )}

      {/* Contenu de la bannière */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        {title && (
          <h2
            className="text-3xl md:text-5xl font-bold mb-4"
            style={{ color: textColor }}
          >
            {title}
          </h2>
        )}

        {subtitle && (
          <p
            className="text-lg md:text-xl max-w-2xl mb-8"
            style={{ color: textColor }}
          >
            {subtitle}
          </p>
        )}

        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
};

export default BannerComponent;
