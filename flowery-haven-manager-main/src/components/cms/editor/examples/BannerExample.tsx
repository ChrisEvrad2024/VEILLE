// src/components/cms/editor/examples/BannerExample.tsx
import React from "react";
import { cmsEditorService } from "@/services/cms-editor.service";
import { ComponentItem } from "@/components/cms/editor/DragDropEditor";

/**
 * Exemple de configuration prédéfinie pour une bannière
 */
const BannerExample: React.FC<{
  onSelect: (component: ComponentItem) => void;
}> = ({ onSelect }) => {
  // Créer un exemple de bannière avec les valeurs par défaut
  const handleCreateBanner = () => {
    const defaults = cmsEditorService.getComponentDefaults("banner");

    // Personnaliser avec des valeurs spécifiques
    const customContent = {
      ...defaults.content,
      title: "Bienvenue chez Flowery Haven",
      subtitle:
        "Des fleurs fraîches et arrangées avec passion pour toutes les occasions",
      image: "/assets/logo.jpeg",
      buttonText: "Découvrir nos collections",
      buttonLink: "/collections",
    };

    const customSettings = {
      ...defaults.settings,
      height: "large",
    };

    // Créer le composant
    const bannerComponent: ComponentItem = {
      id: `banner-${Date.now()}`,
      type: "banner",
      content: customContent,
      settings: customSettings,
      order: 0,
    };

    // Retourner à l'appelant
    onSelect(bannerComponent);
  };

  return (
    <div
      className="cursor-pointer border rounded-md p-4 hover:bg-muted/50 transition-colors"
      onClick={handleCreateBanner}
    >
      <div className="aspect-video relative overflow-hidden rounded-md mb-3">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/assets/logo.jpeg)` }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center text-white">
          <h3 className="text-lg font-bold mb-1">Bannière d'accueil</h3>
          <p className="text-xs">Avec image et bouton d'action</p>
        </div>
      </div>
      <h4 className="font-medium text-sm">Bannière principale</h4>
      <p className="text-xs text-muted-foreground">Cliquez pour ajouter</p>
    </div>
  );
};

export default BannerExample;
