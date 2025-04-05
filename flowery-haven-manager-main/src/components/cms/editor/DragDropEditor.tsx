// src/components/cms/editor/DragDropEditor.tsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, EyeIcon, Trash2, Plus, AlertTriangle } from 'lucide-react';
import ComponentPalette from './ComponentPalette';
import DropZone from './DropZone';
import ComponentSettings from './ComponentSettings';
import { cmsService } from '@/services/cms.service';
import { cmsFrontendService } from '@/services/cms-frontend.service';
import { cmsEditorService } from '@/services/cms-editor.service';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter
} from "@/components/ui/alert-dialog";
import TemplateLibrary from './TemplateLibrary';

// Types pour les composants
export interface ComponentItem {
  id: string;
  type: string;
  content: any;
  settings: any;
  order: number;
}

interface DragDropEditorProps {
  pageId: string;
  initialComponents: ComponentItem[];
  onSave?: () => void;
}

const DragDropEditor: React.FC<DragDropEditorProps> = ({ 
  pageId, 
  initialComponents = [],
  onSave 
}) => {
  const [components, setComponents] = useState<ComponentItem[]>(initialComponents);
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
  const [componentToDelete, setComponentToDelete] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [autoSave, setAutoSave] = useState<boolean>(false);
  const [showEmptyState, setShowEmptyState] = useState<boolean>(false);

  useEffect(() => {
    // Trier les composants par ordre
    const sortedComponents = [...initialComponents].sort((a, b) => a.order - b.order);
    setComponents(sortedComponents);
    
    // Si aucun composant, montrer l'état vide après 1 seconde
    if (initialComponents.length === 0) {
      const timer = setTimeout(() => {
        setShowEmptyState(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowEmptyState(false);
    }
  }, [initialComponents]);

  // Détection des changements
  useEffect(() => {
    if (components.length !== initialComponents.length) {
      setHasChanges(true);
      return;
    }

    // Comparer les composants
    const sortedInitial = [...initialComponents].sort((a, b) => a.order - b.order);
    const sortedCurrent = [...components].sort((a, b) => a.order - b.order);
    
    for (let i = 0; i < sortedCurrent.length; i++) {
      if (JSON.stringify(sortedCurrent[i]) !== JSON.stringify(sortedInitial[i])) {
        setHasChanges(true);
        return;
      }
    }
    
    setHasChanges(false);
  }, [components, initialComponents]);

  // AutoSave toutes les 2 minutes si autoSave est activé et s'il y a des changements
  useEffect(() => {
    if (!autoSave || !hasChanges) return;
    
    const interval = setInterval(() => {
      handleSave(true); // Le paramètre true indique un autoSave silencieux
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [autoSave, hasChanges, components]);

  // Gestion du drag-and-drop
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Si déposé hors d'une zone valide
    if (!destination) return;

    // Si déposé au même endroit
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Si déplacé de la palette vers la zone de contenu
    if (source.droppableId === 'component-palette' && destination.droppableId === 'page-content') {
      // Récupérer le composant depuis la palette
      const componentType = draggableId.split('-')[0];
      
      try {
        // Créer une nouvelle instance du composant
        const newComponent: ComponentItem = {
          id: `${componentType}-${Date.now()}`,
          type: componentType,
          content: getDefaultContent(componentType),
          settings: getDefaultSettings(componentType),
          order: destination.index * 10
        };

        // Ajouter à la liste des composants
        const newComponents = [...components];
        newComponents.splice(destination.index, 0, newComponent);
        
        // Mettre à jour les ordres
        updateComponentsOrder(newComponents);
        
        // Sélectionner automatiquement le nouveau composant pour édition
        setSelectedComponent(newComponent);
      } catch (error) {
        console.error("Erreur lors de la création d'un nouveau composant:", error);
        toast.error("Erreur lors de l'ajout du composant");
      }
      
      return;
    }

    // Si déplacé dans la zone de contenu
    if (source.droppableId === 'page-content' && destination.droppableId === 'page-content') {
      const newComponents = [...components];
      const [movedComponent] = newComponents.splice(source.index, 1);
      newComponents.splice(destination.index, 0, movedComponent);
      
      // Mettre à jour les ordres
      updateComponentsOrder(newComponents);
      
      return;
    }
  };

  // Mise à jour de l'ordre des composants
  const updateComponentsOrder = (componentsList: ComponentItem[]) => {
    const updatedComponents = componentsList.map((component, index) => ({
      ...component,
      order: index * 10
    }));
    
    setComponents(updatedComponents);
    setHasChanges(true);
  };

  // Obtenir le contenu par défaut selon le type de composant
  const getDefaultContent = (type: string): any => {
    try {
      // Utiliser le service pour obtenir les valeurs par défaut
      const defaults = cmsEditorService.getComponentDefaults(type);
      return defaults.content;
    } catch (error) {
      console.error(`Erreur lors de la récupération des valeurs par défaut pour le type ${type}:`, error);
      
      // Valeurs de secours au cas où le service échoue
      switch (type) {
        case 'banner':
          return {
            title: "Titre de la bannière",
            subtitle: "Sous-titre de la bannière",
            image: "/assets/logo.jpeg",
            buttonText: "En savoir plus",
            buttonLink: "/collections"
          };
        case 'slider':
          return {
            slides: [
              {
                title: "Collection printemps",
                description: "Découvrez notre nouvelle collection",
                image: "/assets/logo.jpeg"
              },
              {
                title: "Livraison gratuite",
                description: "Pour toute commande supérieure à 50€",
                image: "/assets/logo.jpeg"
              }
            ]
          };
        case 'promotion':
          return {
            title: "Offre spéciale",
            subtitle: "Offre limitée dans le temps",
            description: "Profitez de cette offre exceptionnelle !",
            image: "/assets/logo.jpeg",
            backgroundColor: "#ff5252",
            textColor: "#ffffff",
            ctaText: "En profiter",
            ctaLink: "/promotions",
            discount: "-20%",
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          };
        default:
          return {};
      }
    }
  };

  // Obtenir les paramètres par défaut selon le type de composant
  const getDefaultSettings = (type: string): any => {
    try {
      // Utiliser le service pour obtenir les valeurs par défaut
      const defaults = cmsEditorService.getComponentDefaults(type);
      return defaults.settings;
    } catch (error) {
      console.error(`Erreur lors de la récupération des paramètres par défaut pour le type ${type}:`, error);
      
      // Valeurs de secours au cas où le service échoue
      switch (type) {
        case 'banner':
          return {
            fullWidth: true,
            height: "medium",
            textColor: "#ffffff"
          };
        case 'slider':
          return {
            autoplay: true,
            interval: 5000,
            showDots: true
          };
        case 'promotion':
          return {
            fullWidth: true,
            layout: "horizontal",
            rounded: true,
            showBadge: true,
            badgeText: "PROMO",
            animateBadge: true,
            shadow: true
          };
        default:
          return {};
      }
    }
  };

  // Mettre à jour un composant
  const handleComponentUpdate = (updatedComponent: ComponentItem) => {
    const newComponents = components.map(comp => 
      comp.id === updatedComponent.id ? updatedComponent : comp
    );
    
    setComponents(newComponents);
    setSelectedComponent(updatedComponent);
    setHasChanges(true);
  };

  // Supprimer un composant
  const handleDeleteComponent = (componentId: string) => {
    setComponentToDelete(componentId);
    setIsConfirmDeleteOpen(true);
  };
  
  // Confirmer la suppression
  const confirmDeleteComponent = () => {
    if (!componentToDelete) return;
    
    const newComponents = components.filter(comp => comp.id !== componentToDelete);
    updateComponentsOrder(newComponents);
    
    if (selectedComponent?.id === componentToDelete) {
      setSelectedComponent(null);
    }
    
    setIsConfirmDeleteOpen(false);
    setComponentToDelete(null);
    toast.success("Composant supprimé");
    setHasChanges(true);
  };

  // Ajouter un composant à la liste
  const handleAddComponent = (component: ComponentItem) => {
    // Ajouter le composant à la fin de la liste
    const newComponents = [...components, { 
      ...component, 
      order: components.length * 10 
    }];
    
    setComponents(newComponents);
    setSelectedComponent(component);
    setHasChanges(true);
    toast.success(`Composant ${component.type} ajouté`);
  };

  // Générer le contenu HTML complet
  const generatePageContent = () => {
    // Trier les composants par ordre
    const sortedComponents = [...components].sort((a, b) => a.order - b.order);
    
    // Générer le contenu avec les balises de composants
    let content = "";
    
    sortedComponents.forEach((component, index) => {
      // Créer un objet avec le contenu et les paramètres
      const componentData = {
        content: component.content,
        settings: component.settings
      };
      
      // Ajouter la balise de composant au contenu
      content += `\n<!-- component:${component.id}:${component.order}:${JSON.stringify(componentData)} -->`;
    });
    
    return content;
  };

  // Enregistrer les modifications
  const handleSave = async (silent: boolean = false) => {
    if (!hasChanges) {
      if (!silent) toast.info("Aucun changement à enregistrer");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Générer le contenu HTML avec les composants
      const newContent = generatePageContent();
      
      // Mettre à jour la page
      await cmsService.updatePage(pageId, {
        content: newContent
      });
      
      setHasChanges(false);
      
      if (!silent) {
        toast.success("Page mise à jour avec succès");
      }
      
      // Appeler le callback onSave si fourni
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde de la page");
    } finally {
      setIsSaving(false);
    }
  };

  // Prévisualiser la page
  const handlePreview = () => {
    // Générer le contenu de prévisualisation
    const previewHTML = generatePreviewHTML();
    setPreviewContent(previewHTML);
    setIsPreviewOpen(true);
  };
  
  // Voir la page dans un nouvel onglet
  const handleViewLive = () => {
    // Récupérer la page pour obtenir le slug
    cmsService.getPageById(pageId).then(page => {
      if (page) {
        window.open(`/${page.slug === "home" ? "" : page.slug}`, '_blank');
      } else {
        toast.error("Impossible de récupérer le slug de la page");
      }
    }).catch(error => {
      console.error("Erreur lors de la récupération de la page:", error);
      toast.error("Erreur lors de l'ouverture de la page");
    });
  };

  // Générer le HTML pour la prévisualisation
  const generatePreviewHTML = () => {
    // Ici nous générons un aperçu simplifié
    // En production, il serait préférable d'utiliser un iframe avec le rendu réel
    
    let preview = `<div style="font-family: system-ui, sans-serif;">`;
    
    // Trier les composants par ordre
    const sortedComponents = [...components].sort((a, b) => a.order - b.order);
    
    sortedComponents.forEach(component => {
      switch (component.type) {
        case 'banner':
          preview += `
            <div style="position: relative; height: 300px; overflow: hidden; ${component.settings.fullWidth ? 'width: 100%' : 'max-width: 1200px; margin: 0 auto'}; margin-bottom: 20px;">
              <div style="position: absolute; inset: 0; background-image: url(${component.content.image}); background-size: cover; background-position: center;">
                <div style="position: absolute; inset: 0; background-color: rgba(0,0,0,0.4);"></div>
              </div>
              <div style="position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0 20px;">
                <h2 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; color: ${component.settings.textColor || '#ffffff'};">${component.content.title}</h2>
                <p style="font-size: 1.25rem; max-width: 800px; margin-bottom: 1.5rem; color: ${component.settings.textColor || '#ffffff'};">${component.content.subtitle}</p>
                <a href="${component.content.buttonLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 0.75rem 1.5rem; border-radius: 0.375rem; text-decoration: none; font-weight: 500;">${component.content.buttonText}</a>
              </div>
            </div>
          `;
          break;
          
        case 'promotion':
          preview += `
            <div style="position: relative; overflow: hidden; margin: 2rem 0; ${component.settings.fullWidth ? 'width: 100%' : 'max-width: 1200px; margin: 2rem auto'}; ${component.settings.rounded ? 'border-radius: 0.5rem' : ''}; ${component.settings.shadow ? 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)' : ''};">
              <div style="display: flex; ${component.settings.layout === 'vertical' ? 'flex-direction: column' : 'flex-direction: row'}; background-color: ${component.content.backgroundColor};">
                ${component.content.image ? `
                  <div style="${component.settings.layout === 'horizontal' ? 'width: 33%' : 'width: 100%'}; overflow: hidden;">
                    <img src="${component.content.image}" alt="${component.content.title}" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                ` : ''}
                <div style="padding: 2rem; ${component.settings.layout === 'horizontal' ? 'width: 67%' : 'width: 100%'};">
                  ${component.content.discount ? `<div style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; color: ${component.content.textColor};">${component.content.discount}</div>` : ''}
                  <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; color: ${component.content.textColor};">${component.content.title}</h3>
                  <div style="font-size: 1.25rem; margin-bottom: 1rem; color: ${component.content.textColor};">${component.content.subtitle}</div>
                  <p style="margin-bottom: 1.5rem; color: ${component.content.textColor};">${component.content.description}</p>
                  <a href="${component.content.ctaLink}" style="display: inline-block; background-color: white; color: black; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none; font-weight: 500;">${component.content.ctaText}</a>
                </div>
              </div>
              ${component.settings.showBadge ? `
                <div style="position: absolute; top: 0; right: 0; background-color: #ef4444; color: white; padding: 0.25rem 0.75rem; font-weight: bold; font-size: 0.75rem; text-transform: uppercase; ${component.settings.animateBadge ? 'animation: pulse 2s infinite;' : ''}">
                  ${component.settings.badgeText}
                </div>
              ` : ''}
            </div>
          `;
          break;
          
        case 'slider':
          preview += `
            <div style="position: relative; height: 300px; overflow: hidden; margin-bottom: 20px;">
              ${component.content.slides?.map((slide: any, index: number) => `
                <div style="position: absolute; inset: 0; ${index === 0 ? 'opacity: 1' : 'opacity: 0; pointer-events: none'}; transition: opacity 0.5s;">
                  <div style="position: absolute; inset: 0; background-image: url(${slide.image}); background-size: cover; background-position: center;">
                    <div style="position: absolute; inset: 0; background-color: rgba(0,0,0,0.3);"></div>
                  </div>
                  <div style="position: relative; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; padding: 0 20px; color: white;">
                    <h3 style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${slide.title}</h3>
                    <p style="font-size: 1rem; max-width: 800px;">${slide.description}</p>
                  </div>
                </div>
              `).join('')}
              ${component.settings.showDots && component.content.slides?.length > 1 ? `
                <div style="position: absolute; bottom: 1rem; left: 0; right: 0; display: flex; justify-content: center; gap: 0.5rem;">
                  ${component.content.slides?.map((_: any, index: number) => `
                    <button style="width: 0.75rem; height: 0.75rem; border-radius: 50%; background-color: ${index === 0 ? 'white' : 'rgba(255, 255, 255, 0.5)'}; border: none;"></button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
          break;
          
        default:
          preview += `<div style="padding: 1rem; margin: 1rem 0; border: 1px dashed #ccc; text-align: center;">Composant de type "${component.type}"</div>`;
      }
    });
    
    preview += `</div>`;
    
    return preview;
  };

  // Appliquer un template de page
  const handleApplyTemplate = (templateComponents: ComponentItem[]) => {
    // Demander confirmation si des composants existent déjà
    if (components.length > 0) {
      if (!window.confirm("Cela remplacera tous vos composants actuels. Êtes-vous sûr de vouloir continuer ?")) {
        return;
      }
    }
    
    // Appliquer le template
    setComponents(templateComponents);
    setHasChanges(true);
    toast.success("Template appliqué avec succès");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 p-4 bg-muted/30 rounded-md">
        <h2 className="text-xl font-bold">Éditeur visuel</h2>
        <div className="flex gap-2">
          <div className="flex items-center mr-2">
            <Switch 
              id="autoSave"
              checked={autoSave}
              onCheckedChange={setAutoSave}
              className="mr-2"
            />
            <Label htmlFor="autoSave" className="text-sm">Auto-save</Label>
          </div>
          <TemplateLibrary 
            onAddComponent={handleAddComponent}
            onApplyTemplate={handleApplyTemplate}
          />
          <Button 
            variant="outline" 
            onClick={handleViewLive}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Voir la page
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePreview}
            className="flex items-center gap-2"
          >
            <EyeIcon className="h-4 w-4" />
            Aperçu
          </Button>
          <Button 
            onClick={() => handleSave(false)} 
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="w-1/4 bg-muted/20 p-4 rounded-md">
            <h3 className="font-medium mb-3">Composants disponibles</h3>
            <ComponentPalette />
          </div>
          
          <div className="w-1/2 flex flex-col">
            <h3 className="font-medium mb-3">Zone d'édition</h3>
            <div className="flex-1 bg-muted/20 p-4 rounded-md overflow-auto">
              <DropZone 
                components={components}
                onDelete={handleDeleteComponent}
                onSelect={setSelectedComponent}
                selectedId={selectedComponent?.id}
              />
              
              {components.length === 0 && showEmptyState && (
                <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-muted-foreground/20 rounded-md p-4">
                  <p className="text-muted-foreground text-center mb-4">
                    Glissez-déposez des composants depuis la palette pour créer votre page
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const newComponent: ComponentItem = {
                        id: `banner-${Date.now()}`,
                        type: 'banner',
                        content: getDefaultContent('banner'),
                        settings: getDefaultSettings('banner'),
                        order: 0
                      };
                      setComponents([newComponent]);
                      setSelectedComponent(newComponent);
                      setHasChanges(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une bannière
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-1/4 bg-muted/20 p-4 rounded-md">
            <h3 className="font-medium mb-3">Propriétés</h3>
            {selectedComponent ? (
              <ComponentSettings 
                component={selectedComponent} 
                onChange={handleComponentUpdate}
                onDelete={() => handleDeleteComponent(selectedComponent.id)}
              />
            ) : (
              <div className="text-muted-foreground text-center p-4">
                Sélectionnez un composant pour éditer ses propriétés
              </div>
            )}
          </div>
        </DragDropContext>
      </div>

      {/* Dialogue de prévisualisation */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[80%] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de la page</DialogTitle>
          </DialogHeader>
          <div className="border rounded-md p-4 mt-4 overflow-auto max-h-[60vh]">
            <iframe 
              srcDoc={previewContent}
              className="w-full h-[60vh] border-none"
              title="Aperçu de la page"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fermer
            </Button>
            <Button onClick={handleViewLive}>
              Voir la page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation de suppression */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce composant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Le composant sera définitivement supprimé
              de la page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteComponent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Alerte pour les changements non enregistrés */}
      {hasChanges && !autoSave && (
        <div className="fixed bottom-4 right-4 bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 text-sm">
            Vous avez des modifications non enregistrées.
          </div>
          <Button 
            size="sm"
            onClick={() => handleSave(false)}
            className="ml-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
};

// Composant Switch manquant, ajoutons-le pour compléter le code
const Switch = ({ id, checked, onCheckedChange, className = "" }) => {
  return (
    <div className={`relative inline-flex h-5 w-10 items-center rounded-full ${checked ? 'bg-primary' : 'bg-gray-300'} transition-colors ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`${
          checked ? 'translate-x-5' : 'translate-x-1'
        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
      />
    </div>
  );
};

// Composant Label manquant
const Label = ({ htmlFor, children, className = "" }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium ${className}`}
    >
      {children}
    </label>
  );
};

export default DragDropEditor;