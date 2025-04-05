// src/components/cms/editor/TemplateLibrary.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout, Plus, LibraryBig, BookOpen, LayoutTemplate } from 'lucide-react';
import { cmsEditorService } from '@/services/cms-editor.service';
import { ComponentItem } from './DragDropEditor';

interface TemplateLibraryProps {
  onAddComponent?: (component: ComponentItem) => void;
  onApplyTemplate?: (components: ComponentItem[]) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ 
  onAddComponent,
  onApplyTemplate
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  
  // Récupérer les templates depuis le service
  const pageTemplates = cmsEditorService.getPageTemplates();
  
  // Récupérer les composants par défaut pour la bibliothèque de composants
  const componentLibrary = [
    {
      type: 'banner',
      name: 'Bannière hero',
      description: 'Grande bannière avec titre, sous-titre et bouton d\'action',
      preview: <div className="bg-muted/30 p-3 rounded-md text-center h-20 flex items-center justify-center">Bannière</div>
    },
    {
      type: 'promotion',
      name: 'Promotion spéciale',
      description: 'Mise en avant d\'une offre spéciale ou promotion',
      preview: <div className="bg-rose-500/20 p-3 rounded-md text-center h-20 flex items-center justify-center text-rose-800">Promotion</div>
    },
    {
      type: 'slider',
      name: 'Slider d\'images',
      description: 'Carrousel d\'images avec navigation',
      preview: <div className="bg-cyan-500/20 p-3 rounded-md text-center h-20 flex items-center justify-center text-cyan-800">Slider</div>
    },
    {
      type: 'testimonials',
      name: 'Témoignages clients',
      description: 'Slider de témoignages clients avec photos',
      preview: <div className="bg-amber-500/20 p-3 rounded-md text-center h-20 flex items-center justify-center text-amber-800">Témoignages</div>
    },
    {
      type: 'text',
      name: 'Section de texte',
      description: 'Bloc de texte riche avec titre et formatage',
      preview: <div className="bg-blue-500/20 p-3 rounded-md text-center h-20 flex items-center justify-center text-blue-800">Texte riche</div>
    },
    {
      type: 'newsletter',
      name: 'Inscription newsletter',
      description: 'Formulaire d\'inscription à la newsletter',
      preview: <div className="bg-green-500/20 p-3 rounded-md text-center h-20 flex items-center justify-center text-green-800">Newsletter</div>
    }
  ];
  
  // Gérer l'ajout d'un composant depuis la bibliothèque
  const handleAddComponent = (type: string) => {
    if (!onAddComponent) return;
    
    const defaultData = cmsEditorService.getComponentDefaults(type);
    
    const newComponent: ComponentItem = {
      id: cmsEditorService.generateComponentId(type),
      type,
      content: defaultData.content,
      settings: defaultData.settings,
      order: 0
    };
    
    onAddComponent(newComponent);
    setIsDialogOpen(false);
  };
  
  // Gérer l'application d'un template
  const handleApplyTemplate = (templateId: string) => {
    if (!onApplyTemplate) return;
    
    const selectedTemplate = pageTemplates.find(t => t.id === templateId);
    
    if (!selectedTemplate) return;
    
    // Convertir les composants du template au format attendu
    const templateComponents: ComponentItem[] = selectedTemplate.components.map(comp => ({
      id: cmsEditorService.generateComponentId(comp.type),
      type: comp.type,
      content: comp.content,
      settings: comp.settings,
      order: comp.order
    }));
    
    onApplyTemplate(templateComponents);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <LibraryBig className="h-4 w-4" />
          <span>Bibliothèque</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Bibliothèque de composants et de templates</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="templates" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Templates de page
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Composants
            </TabsTrigger>
          </TabsList>
          
          {/* Templates de page */}
          <TabsContent value="templates" className="py-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Ces templates vous permettent de créer rapidement des pages complètes avec plusieurs composants.
                L'application d'un template remplacera tous les composants existants sur votre page.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {pageTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">{template.components.length} composants</span>
                    </div>
                    <div className="border rounded-md p-2 bg-muted/20">
                      <ul className="text-sm space-y-1">
                        {template.components.map((component, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">{i+1}</span>
                            <span>{component.type.charAt(0).toUpperCase() + component.type.slice(1)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleApplyTemplate(template.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Appliquer ce template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Bibliothèque de composants */}
          <TabsContent value="components" className="py-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Choisissez parmi ces composants prédéfinis pour ajouter rapidement du contenu à votre page.
                Les composants seront ajoutés à la fin de votre page.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {componentLibrary.map((component) => (
                <Card key={component.type} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">{component.name}</CardTitle>
                    <CardDescription className="text-xs">{component.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="py-2 flex-grow">
                    {component.preview}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleAddComponent(component.type)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateLibrary;