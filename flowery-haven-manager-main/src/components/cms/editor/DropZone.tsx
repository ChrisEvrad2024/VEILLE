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
  Eye,
  ChevronUp,
  ChevronDown,
  Copy
} from 'lucide-react';
import { ComponentItem } from './DragDropEditor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DropZoneProps {
  components: ComponentItem[];
  onDelete: (id: string) => void;
  onSelect: (component: ComponentItem) => void;
  onDuplicate?: (component: ComponentItem) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  selectedId?: string;
}

const DropZone: React.FC<DropZoneProps> = ({ 
  components, 
  onDelete, 
  onSelect, 
  onDuplicate,
  onMoveUp,
  onMoveDown,
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
          return (
            <div className="relative p-4 bg-muted/30 border rounded-md overflow-hidden">
              <div className="relative aspect-[3/1] overflow-hidden rounded">
                {component.content.image && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${component.content.image})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                  </div>
                )}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
                  <h3 className="text-lg font-bold mb-1 text-white">
                    {component.content.title}
                  </h3>
                  <p className="text-sm text-white mb-2 line-clamp-1">
                    {component.content.subtitle}
                  </p>
                  {component.content.buttonText && (
                    <div className="inline-block bg-primary text-white px-3 py-1 rounded text-sm">
                      {component.content.buttonText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
          
        case 'promotion':
          return (
            <div className="relative p-4 bg-muted/30 border rounded-md overflow-hidden">
              <div
                className="relative overflow-hidden rounded"
                style={{
                  backgroundColor: component.content.backgroundColor || "#ff5252",
                }}
              >
                <div className="flex p-4 text-white">
                  {component.content.image && (
                    <div className="w-1/3 mr-4">
                      <img
                        src={component.content.image}
                        alt=""
                        className="rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    {component.content.discount && (
                      <div className="text-xl font-bold mb-1">
                        {component.content.discount}
                      </div>
                    )}
                    <h3 className="font-bold line-clamp-1">{component.content.title}</h3>
                    <p className="text-sm mb-2 line-clamp-1">{component.content.subtitle}</p>
                    {component.content.ctaText && (
                      <div className="inline-block bg-white text-black px-2 py-1 rounded text-xs">
                        {component.content.ctaText}
                      </div>
                    )}
                  </div>
                </div>
                {component.settings.showBadge && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 py-1 font-bold">
                    {component.settings.badgeText || "PROMO"}
                  </div>
                )}
              </div>
            </div>
          );
          
        case 'slider':
          return (
            <div className="relative p-4 bg-muted/30 border rounded-md overflow-hidden">
              <div className="relative aspect-[3/1] overflow-hidden rounded">
                {component.content.slides && component.content.slides.length > 0 && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${component.content.slides[0].image})`,
                      }}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
                      <h3 className="text-lg font-bold mb-1 text-white line-clamp-1">
                        {component.content.slides[0].title}
                      </h3>
                      <p className="text-sm text-white mb-2 line-clamp-1">
                        {component.content.slides[0].description}
                      </p>
                    </div>
                    {component.content.slides.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {component.content.slides.map((_: any, i: number) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i === 0 ? 'bg-white' : 'bg-white/50'
                            }`}
                          ></div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
          
        case 'text':
          return (
            <div className="relative p-4 bg-muted/30 border rounded-md overflow-hidden">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-bold mb-2">
                  {component.content.title || "Titre du contenu"}
                </h3>
                <div className="line-clamp-3 text-sm text-muted-foreground">
                  {component.content.text ? (
                    <div dangerouslySetInnerHTML={{ __html: component.content.text }} />
                  ) : (
                    "Contenu textuel..."
                  )}
                </div>
              </div>
            </div>
          );
          
        case 'newsletter':
          return (
            <div className="relative p-4 bg-muted/30 border rounded-md overflow-hidden">
              <div className="text-center py-4">
                <h3 className="text-lg font-bold mb-2">
                  {component.content.title || "Inscrivez-vous à notre newsletter"}
                </h3>
                <p className="text-sm mb-4 text-muted-foreground line-clamp-1">
                  {component.content.description || "Restez informé de nos dernières offres"}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-8 bg-background rounded border border-input w-40"></div>
                  <div className="h-8 bg-primary text-white px-4 rounded flex items-center justify-center text-sm">
                    {component.content.buttonText || "S'abonner"}
                  </div>
                </div>
              </div>
            </div>
          );
          
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
                        <TooltipProvider>
                          {onMoveUp && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => onMoveUp(index)}
                                  disabled={index === 0}
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Déplacer vers le haut</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {onMoveDown && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => onMoveDown(index)}
                                  disabled={index === components.length - 1}
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Déplacer vers le bas</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {onDuplicate && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => onDuplicate(component)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Dupliquer</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onSelect(component)}
                              >
                                <Settings className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Éditer</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:text-destructive"
                                onClick={() => onDelete(component.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supprimer</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div 
                      className="p-3 border-l-2 transition-colors cursor-pointer hover:bg-muted/20"
                      style={{ borderLeftColor: selectedId === component.id ? 'var(--primary)' : 'transparent' }}
                      onClick={() => onSelect(component)}
                    >
                      <div className="overflow-hidden max-h-60">
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