// src/components/cms/editor/TemplateLibrary.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ComponentItem } from './DragDropEditor';
import BannerExample from './examples/BannerExample';
import PromotionExample from './examples/PromotionExample';
import SliderExample from './examples/SliderExample';
import { LayoutTemplate, Palette, Plus } from 'lucide-react';

// Définir les types de sections
interface TemplateSection {
  name: string;
  components: ComponentItem[];
}

// Templates prédéfinis complets
interface PageTemplate {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sections: TemplateSection[];
}

// Liste des templates pré-configurés
const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'home-standard',
    name: 'Accueil Standard',
    description: 'Page d\'accueil avec bannière, slider et section promotionnelle',
    imageUrl: '/assets/logo.jpeg',
    sections: [
      {
        name: 'En-tête',
        components: []
      }
    ]
  },
  {
    id: 'promo-page',
    name: 'Page Promotionnelle',
    description: 'Mise en avant des offres spéciales avec plusieurs sections promotionnelles',
    imageUrl: '/assets/logo.jpeg',
    sections: []
  }
];

interface TemplateLibraryProps {
  onAddComponent: (component: ComponentItem) => void;
  onApplyTemplate?: (components: ComponentItem[]) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onAddComponent, onApplyTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('components');

  // Gérer la sélection d'un composant
  const handleSelectComponent = (component: ComponentItem) => {
    onAddComponent(component);
    setIsOpen(false);
  };

  // Gérer l'application d'un template complet
  const handleApplyTemplate = (template: PageTemplate) => {
    // Créer tous les composants du template
    const allComponents: ComponentItem[] = [];
    let orderCounter = 0;

    template.sections.forEach(section => {
      section.components.forEach(component => {
        // Cloner le composant et générer un nouvel ID
        const newComponent: ComponentItem = {
          ...component,
          id: `${component.type}-${Date.now()}-${orderCounter}`,
          order: orderCounter * 10
        };
        
        allComponents.push(newComponent);
        orderCounter++;
      });
    });

    // Si des composants sont définis, appliquer le template
    if (allComponents.length > 0 && onApplyTemplate) {
      onApplyTemplate(allComponents);
      setIsOpen(false);
    } else {
      // Sinon, ajouter juste un composant par défaut
      const banner = {
        id: `banner-${Date.now()}`,
        type: 'banner',
        content: {
          title: "Bienvenue chez Flowery Haven",
          subtitle: "Des fleurs fraîches et arrangées avec passion pour toutes les occasions",
          image: "/assets/logo.jpeg",
          buttonText: "Découvrir nos collections",
          buttonLink: "/collections"
        },
        settings: {
          fullWidth: true,
          height: "large",
          textColor: "#ffffff"
        },
        order: 0
      };
      
      onAddComponent(banner);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter du contenu
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Bibliothèque de contenus</DialogTitle>
            <DialogDescription>
              Choisissez parmi nos composants et templates pré-configurés pour créer rapidement votre page.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Composants individuels
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4" />
                  Templates de page
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="components" className="mt-4">
                <ScrollArea className="h-[450px] pr-4">
                  <div className="grid grid-cols-3 gap-4">
                    <BannerExample onSelect={handleSelectComponent} />
                    <SliderExample onSelect={handleSelectComponent} />
                    <PromotionExample onSelect={handleSelectComponent} />
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="templates" className="mt-4">
                <ScrollArea className="h-[450px] pr-4">
                  <div className="grid grid-cols-2 gap-6">
                    {PAGE_TEMPLATES.map(template => (
                      <div 
                        key={template.id}
                        className="border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <div className="aspect-video bg-muted relative">
                          <img 
                            src={template.imageUrl} 
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <h3 className="text-xl font-bold text-white">{template.name}</h3>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplateLibrary;