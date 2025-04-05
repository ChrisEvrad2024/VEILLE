// src/components/cms/editor/ComponentPalette.tsx
import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Image, 
  SlidersHorizontal, 
  Tag, 
  Mail, 
  FileText, 
  Video, 
  Code, 
  MessageSquare, 
  ShoppingCart,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Interface pour un type de composant dans la palette
interface ComponentType {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// Liste des types de composants disponibles
const componentTypes: ComponentType[] = [
  {
    id: 'banner-palette',
    type: 'banner',
    label: 'Bannière',
    icon: <Image className="h-5 w-5" />,
    description: 'Grande image avec titre, sous-titre et bouton d\'action'
  },
  {
    id: 'slider-palette',
    type: 'slider',
    label: 'Slider',
    icon: <SlidersHorizontal className="h-5 w-5" />,
    description: 'Carrousel d\'images avec navigation'
  },
  {
    id: 'promotion-palette',
    type: 'promotion',
    label: 'Promotion',
    icon: <Tag className="h-5 w-5" />,
    description: 'Mise en avant d\'une offre spéciale ou promotion'
  },
  {
    id: 'text-palette',
    type: 'text',
    label: 'Texte',
    icon: <FileText className="h-5 w-5" />,
    description: 'Section de texte riche avec titre'
  },
  {
    id: 'newsletter-palette',
    type: 'newsletter',
    label: 'Newsletter',
    icon: <Mail className="h-5 w-5" />,
    description: 'Formulaire d\'inscription à la newsletter'
  },
  {
    id: 'video-palette',
    type: 'video',
    label: 'Vidéo',
    icon: <Video className="h-5 w-5" />,
    description: 'Intégration de vidéo YouTube ou autre'
  },
  {
    id: 'html-palette',
    type: 'html',
    label: 'HTML',
    icon: <Code className="h-5 w-5" />,
    description: 'Code HTML personnalisé'
  },
  {
    id: 'testimonials-palette',
    type: 'testimonials',
    label: 'Témoignages',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'Affichage de témoignages clients'
  },
  {
    id: 'featured_products-palette',
    type: 'featured_products',
    label: 'Produits',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'Grille de produits en vedette'
  }
];

// Groupes de composants
const componentGroups = [
  {
    title: 'Basiques',
    types: ['banner', 'text', 'html']
  },
  {
    title: 'Médias',
    types: ['slider', 'video']
  },
  {
    title: 'Marketing',
    types: ['promotion', 'newsletter', 'testimonials', 'featured_products']
  }
];

const ComponentPalette = () => {
  return (
    <Droppable droppableId="component-palette" isDropDisabled={true}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          <TooltipProvider>
            <div className="mb-6">
              <div className="bg-muted/30 p-2 rounded mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Glissez les composants dans la zone d'édition</span>
              </div>

              {componentGroups.map((group, groupIndex) => (
                <div key={group.title} className="mb-4">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                    {group.title}
                  </h4>
                  <div className="space-y-2">
                    {componentTypes
                      .filter(comp => group.types.includes(comp.type))
                      .map((component, index) => (
                        <Draggable 
                          key={component.id} 
                          draggableId={component.id}
                          index={(groupIndex * 10) + index}
                        >
                          {(provided, snapshot) => (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex items-center p-2 rounded-md cursor-grab ${
                                    snapshot.isDragging 
                                      ? 'bg-primary/10 shadow-md'
                                      : 'bg-card hover:bg-muted transition-colors'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className={`p-1.5 rounded bg-primary/10 text-primary`}>
                                      {component.icon}
                                    </div>
                                    <span>{component.label}</span>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>{component.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </Draggable>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            {provided.placeholder}
          </TooltipProvider>
        </div>
      )}
    </Droppable>
  );
};

export default ComponentPalette;