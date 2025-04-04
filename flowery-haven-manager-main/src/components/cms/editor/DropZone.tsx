// src/components/cms/editor/DropZone.tsx
import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  GripVertical, 
  Image, 
  SlidersHorizontal, 
  Tag, 
  Mail, 
  FileText, 
  Video, 
  Code, 
  MessageSquare,
  ShoppingCart,
  Settings,
  Eye
} from 'lucide-react';
import { ComponentItem } from './DragDropEditor';
import BannerComponent from '../components/BannerComponent';
import SliderComponent from '../components/SliderComponent';
import PromotionComponent from '../components/PromotionComponent';
import NewsletterComponent from '../components/NewsletterComponent';
import TextComponent from '../components/TextComponent';
import VideoComponent from '../components/VideoComponent';
import HtmlComponent from '../components/HtmlComponent';

interface DropZoneProps {
  components: ComponentItem[];
  onDelete: (id: string) => void;
  onSelect: (component: ComponentItem) => void;
  selectedId?: string;
}

const DropZone: React.FC<DropZoneProps> = ({ 
  components, 
  onDelete, 
  onSelect, 
  selectedId 
}) => {
  // Fonction pour obtenir l'icône correspondant au type de composant
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'banner':
        return <Image className="h-4 w-4" />;
      case 'slider':
        return <SlidersHorizontal className="h-4 w-4" />;
      case 'promotion':
        return <Tag className="h-4 w-4" />;
      case 'newsletter':
        return <Mail className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'html':
        return <Code className="h-4 w-4" />;
      case 'testimonials':
        return <MessageSquare className="h-4 w-4" />;
      case 'featured_products':
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  // Fonction pour obtenir le nom lisible du type de composant
  const getComponentName = (type: string) => {
    switch (type) {
      case 'banner':
        return 'Bannière';
      case 'slider':
        return 'Slider';
      case 'promotion':
        return 'Promotion';
      case 'newsletter':
        return 'Newsletter';
      case 'text':
        return 'Texte';
      case 'video':
        return 'Vidéo';
      case 'html':
        return 'HTML';
      case 'testimonials':
        return 'Témoignages';
      case 'featured_products':
        return 'Produits en vedette';
      default:
        return type;
    }
  };

  // Fonction pour rendre un aperçu du composant
  const renderComponentPreview = (component: ComponentItem) => {
    try {
      switch (component.type) {
        case 'banner':
          return <BannerComponent content={component.content} settings={component.settings} />;
        case 'slider':
          return <SliderComponent content={component.content} settings={component.settings} />;
        case 'promotion':
          return <PromotionComponent content={component.content} settings={component.settings} />;
        case 'newsletter':
          return <NewsletterComponent content={component.content} settings={component.settings} />;
        case 'text':
          return <TextComponent content={component.content} settings={component.settings} />;
        case 'video':
          return <VideoComponent content={component.content} settings={component.settings} />;
        case 'html':
          return <HtmlComponent content={component.content} settings={component.settings} />;
        default:
          return (
            <div className="flex items-center justify-center h-20 bg-muted/30 rounded-md">
              <p className="text-muted-foreground">Aperçu non disponible</p>
            </div>
          );
      }
    } catch (error) {
      console.error(`Erreur lors du rendu de l'aperçu pour ${component.type}:`, error);
      return (
        <div className="flex items-center justify-center h-20 bg-red-100 text-red-800 rounded-md">
          <p>Erreur de rendu</p>
        </div>
      );
    }
  };

  return (
    <Droppable droppableId="page-content">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`min-h-[200px] transition-colors ${
            snapshot.isDraggingOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : ''
          }`}
        >
          {components.length === 0 && !snapshot.isDraggingOver && (
            <div className="flex items-center justify-center h-40 border-2 border-dashed border-muted-foreground/20 rounded-md">
              <p className="text-muted-foreground text-center">
                Glissez-déposez des composants ici
              </p>
            </div>
          )}

          {components
            .sort((a, b) => a.order - b.order)
            .map((component, index) => (
              <Draggable key={component.id} draggableId={component.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`mb-4 rounded-md border overflow-hidden ${
                      selectedId === component.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'border-border'
                    } ${
                      snapshot.isDragging 
                        ? 'bg-primary/5 shadow-lg' 
                        : 'bg-card'
                    }`}
                  >
                    <div className="flex justify-between items-center p-2 bg-muted/30 border-b">
                      <div 
                        {...provided.dragHandleProps}
                        className="flex items-center gap-2 cursor-grab"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-1.5">
                          {getComponentIcon(component.type)}
                          <span className="font-medium text-sm">
                            {getComponentName(component.type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onSelect(component)}
                          title="Éditer"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:text-destructive"
                          onClick={() => onDelete(component.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div 
                      className="p-3 border-l-2 transition-colors cursor-pointer"
                      style={{ borderLeftColor: selectedId === component.id ? 'var(--primary)' : 'transparent' }}
                      onClick={() => onSelect(component)}
                    >
                      <div className="overflow-hidden max-h-80">
                        {renderComponentPreview(component)}
                      </div>
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

export default DropZone;