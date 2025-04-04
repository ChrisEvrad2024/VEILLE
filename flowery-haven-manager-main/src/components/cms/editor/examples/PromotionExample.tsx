// src/components/cms/editor/examples/PromotionExample.tsx
import React from "react";
import { cmsEditorService } from "@/services/cms-editor.service";
import { ComponentItem } from "@/components/cms/editor/DragDropEditor";
import { Tag } from "lucide-react";

/**
 * Exemple de configuration prédéfinie pour une promotion
 */
const PromotionExample: React.FC<{
  onSelect: (component: ComponentItem) => void;
}> = ({ onSelect }) => {
  // Créer un exemple de promotion avec les valeurs par défaut
  const handleCreatePromotion = () => {
    const defaults = cmsEditorService.getComponentDefaults("promotion");

    // Personnaliser avec des valeurs spécifiques pour ChezFlora
    const customContent = {
      ...defaults.content,
      title: "Offre spéciale printemps",
      subtitle: "Collection fraîcheur 2025",
      description:
        "Découvrez nos bouquets et compositions florales spécialement conçus pour célébrer le retour des beaux jours. Profitez d'une remise exceptionnelle sur toute la collection.",
      image: "/assets/logo.jpeg",
      backgroundColor: "#16a34a", // Vert plus vif pour un thème printemps
      textColor: "#ffffff",
      ctaText: "Découvrir l'offre",
      ctaLink: "/promotions/printemps",
      discount: "-20%",
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 14 jours à partir d'aujourd'hui
    };

    const customSettings = {
      ...defaults.settings,
      layout: "horizontal",
      badgeText: "PRINTEMPS",
      animateBadge: true,
    };

    // Créer le composant
    const promotionComponent: ComponentItem = {
      id: `promotion-${Date.now()}`,
      type: "promotion",
      content: customContent,
      settings: customSettings,
      order: 0,
    };

    // Retourner à l'appelant
    onSelect(promotionComponent);
  };

  return (
    <div
      className="cursor-pointer border rounded-md p-4 hover:bg-muted/50 transition-colors"
      onClick={handleCreatePromotion}
    >
      <div className="aspect-video relative overflow-hidden rounded-md mb-3">
        <div className="absolute inset-0 bg-green-600">
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 font-bold">
            PRINTEMPS
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-start justify-center h-full p-4 text-white">
          <div className="text-xl font-bold mb-1">-20%</div>
          <h3 className="text-lg font-bold">Offre spéciale</h3>
          <p className="text-xs">Collection fraîcheur</p>
          <div className="mt-2 bg-white text-green-600 px-2 py-1 text-xs font-medium rounded">
            Découvrir l'offre
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-sm">Promotion printanière</h4>
          <p className="text-xs text-muted-foreground">Cliquez pour ajouter</p>
        </div>
        <Tag className="h-5 w-5 text-green-600" />
      </div>
    </div>
  );
};

export default PromotionExample;
