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
  ShoppingCart
} from 'lucide-react';

interface ComponentType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const componentTypes: ComponentType[] = [
  {
    id: 'banner',
    name: 'Bannière',
    icon: <Image className="h-5 w-5" />,
    description: 'Grande image avec texte et bouton d\'action'
  },
  {
    id: 'slider',
    name: 'Slider',
    icon: <SlidersHorizontal className="h-5 w-5" />,
    description: 'Carousel d\'images défilantes'
  },
  {
    id: 'promotion',
    name: 'Promotion',
    icon: <Tag className="h-5 w-5" />,
    description: 'Mise en avant d\'offres spéciales'
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: <Mail className="h-5 w-5" />,
    description: 'Inscription à la newsletter'
  },
  {
    id: 'text',
    name: 'Texte',
    icon: <FileText className="h-5 w-5" />,
    description: 'Bloc de texte simple'
  },
  {
    id: 'video',
    name: 'Vidéo',
    icon: <Video className="h-5 w-5" />,
    description: 'Intégration de vidéo'
  },
  {
    id: 'html',
    name: 'HTML',
    icon: <Code className="h-5 w-5" />,
    description: 'Contenu HTML personnalisé'
  },
  {
    id: 'testimonials',
    name: 'Témoignages',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'Avis clients'
  },
  {
    id: 'featured_products',
    name: 'Produits en vedette',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'Affichage de produits populaires'
  }
];

const ComponentPalette: React.FC = () => {
  return (
    <Droppable droppableId="component-palette" isDropDisabled={true}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="space-y-2"
        >
          {componentTypes.map((component, index) => (
            <Draggable 
              key={component.id} 
              draggableId={`${component.id}-palette`} 
              index={index}
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`flex items-center p-3 rounded-md border cursor-grab ${
                    snapshot.isDragging 
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card hover:bg-accent/50 border-border'
                  }`}
                >
                  <div className="mr-3 p-2 bg-primary/10 rounded-md text-primary">
                    {component.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{component.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{component.description}</p>
                  </div>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default ComponentPalette;