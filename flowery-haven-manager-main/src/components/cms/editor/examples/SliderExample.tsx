// src/components/cms/editor/examples/SliderExample.tsx
import React from 'react';
import { cmsEditorService } from '@/services/cms-editor.service';
import { ComponentItem } from '@/components/cms/editor/DragDropEditor';
import { SlidersHorizontal } from 'lucide-react';

/**
 * Exemple de configuration prédéfinie pour un slider
 */
const SliderExample: React.FC<{ onSelect: (component: ComponentItem) => void }> = ({ onSelect }) => {
  // Créer un exemple de slider avec les valeurs par défaut
  const handleCreateSlider = () => {
    const defaults = cmsEditorService.getComponentDefaults('slider');
    
    // Personnaliser avec des valeurs spécifiques pour ChezFlora
    const customContent = {
      ...defaults.content,
      slides: [
        {
          title: "Collection Printemps",
          description: "Découvrez nos nouvelles compositions florales de saison",
          image: "/assets/logo.jpeg"
        },
        {
          title: "Livraison Express",
          description: "Livraison le jour même pour toute commande passée avant 14h",
          image: "/assets/logo.jpeg"
        },
        {
          title: "Service Sur-Mesure",
          description: "Créations personnalisées pour vos événements spéciaux",
          image: "/assets/logo.jpeg"
        }
      ]
    };
    
    const customSettings = {
      ...defaults.settings,
      autoplay: true,
      interval: 4000,
      showDots: true
    };
    
    // Créer le composant
    const sliderComponent: ComponentItem = {
      id: `slider-${Date.now()}`,
      type: 'slider',
      content: customContent,
      settings: customSettings,
      order: 0
    };
    
    // Retourner à l'appelant
    onSelect(sliderComponent);
  };
  
  return (
    <div 
      className="cursor-pointer border rounded-md p-4 hover:bg-muted/50 transition-colors"
      onClick={handleCreateSlider}
    >
      <div className="aspect-video relative overflow-hidden rounded-md mb-3">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500">
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white/50"></div>
            <div className="w-2 h-2 rounded-full bg-white/50"></div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center text-white">
          <h3 className="text-lg font-bold mb-1">Collection Printemps</h3>
          <p className="text-xs">Découvrez nos compositions florales</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-sm">Slider d'images</h4>
          <p className="text-xs text-muted-foreground">Cliquez pour ajouter</p>
        </div>
        <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
      </div>
    </div>
  );
};

export default SliderExample;