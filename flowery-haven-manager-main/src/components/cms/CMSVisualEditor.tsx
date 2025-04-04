// src/pages/admin/cms/CMSVisualEditor.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cmsService, PageContent } from '@/services/cms.service';
import { cmsFrontendService } from '@/services/cms-frontend.service';
import DragDropEditor, { ComponentItem } from '@/components/cms/editor/DragDropEditor';

const CMSVisualEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageContent | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visual');

  useEffect(() => {
    if (id) {
      loadPage(id);
    }
  }, [id]);

  const loadPage = async (pageId: string) => {
    try {
      setIsLoading(true);
      
      // Charger la page
      const pageData = await cmsService.getPageById(pageId);
      
      if (!pageData) {
        toast.error('Page non trouvée');
        navigate('/admin/cms');
        return;
      }
      
      setPage(pageData);
      
      // Analyser les composants
      await loadComponents(pageData);
    } catch (error) {
      console.error('Erreur lors du chargement de la page:', error);
      toast.error('Erreur lors du chargement de la page');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComponents = async (pageData: PageContent) => {
    try {
      // Analyser les composants intégrés dans le contenu
      const pageComponents = cmsFrontendService.parsePageComponents(pageData.content);
      
      // Récupérer les données de chaque composant
      const componentsData = await Promise.all(
        pageComponents.map(async (comp) => {
          try {
            // Essayer de charger le composant
            const componentData = await cmsFrontendService.getComponentData(comp.id, comp.options);
            
            if (!componentData) {
              return null;
            }
            
            // Convertir en format compatible avec l'éditeur
            return {
              id: comp.id,
              type: componentData.type,
              content: componentData.content,
              settings: componentData.settings,
              order: comp.order || 0
            };
          } catch (error) {
            console.error(`Erreur lors du chargement du composant ${comp.id}:`, error);
            return null;
          }
        })
      );
      
      // Filtrer les composants valides
      const validComponents = componentsData.filter((comp): comp is ComponentItem => comp !== null);
      
      setComponents(validComponents);
    } catch (error) {
      console.error('Erreur lors du chargement des composants:', error);
      toast.error('Erreur lors du chargement des composants');
    }
  };

  const handlePreview = () => {
    if (page) {
      window.open(`/${page.slug}`, '_blank');
    }
  };

  // Générer le HTML à partir du contenu JSON
  const generateHtmlFromComponents = () => {
    // Trier les composants par ordre
    const sortedComponents = [...components].sort((a, b) => a.order - b.order);
    
    // Générer le contenu avec les balises de composants
    let content = "";
    
    sortedComponents.forEach((component) => {
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

  const handleRefresh = () => {
    if (id) {
      loadPage(id);
    }
  };

  const handleSourceUpdate = async (newSource: string) => {
    if (!page || !id) return;
    
    try {
      // Mettre à jour la page avec le nouveau code source
      await cmsService.updatePage(id, {
        content: newSource
      });
      
      // Recharger la page
      loadPage(id);
      
      toast.success('Code source mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du code source:', error);
      toast.error('Erreur lors de la mise à jour du code source');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/cms')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? 'Chargement...' : (page ? page.title : 'Éditeur CMS visuel')}
            </h1>
            {page && (
              <p className="text-muted-foreground font-mono text-sm">
                /{page.slug === 'home' ? '' : page.slug}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isLoading || !page}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Aperçu
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid w-full grid-cols-2">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Éditeur visuel
            </TabsTrigger>
            <TabsTrigger value="source" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Code source
            </TabsTrigger>
          </TabsList>
          
          <CardContent className="p-0">
            <TabsContent value="visual" className="mt-0">
              <div className="min-h-[600px] p-4">
                {isLoading ? (
                  <div className="flex justify-center items-center h-[500px]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  page && id && (
                    <DragDropEditor
                      pageId={id}
                      initialComponents={components}
                      onSave={handleRefresh}
                    />
                  )
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="source" className="mt-0">
              <SourceEditor 
                content={page?.content || ''} 
                onUpdate={handleSourceUpdate}
                isLoading={isLoading}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

// Éditeur de code source
const SourceEditor = ({ 
  content, 
  onUpdate,
  isLoading
}: { 
  content: string; 
  onUpdate: (newContent: string) => Promise<void>;
  isLoading: boolean;
}) => {
  const [source, setSource] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setSource(content);
  }, [content]);
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(source);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-end mb-2">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Enregistrer
        </Button>
      </div>
      
      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="w-full h-[500px] p-4 font-mono text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Contenu de la page"
        disabled={isLoading}
      />
      
      <div className="text-sm text-muted-foreground">
        <p>Format pour les composants: <code className="bg-muted px-1 py-0.5 rounded">{"<!-- component:ID:ORDER:DATA -->"}</code></p>
        <p className="mt-1">Exemple: <code className="bg-muted px-1 py-0.5 rounded break-all">{"<!-- component:banner-123:10:{\"content\":{\"title\":\"Mon titre\"},\"settings\":{\"fullWidth\":true}} -->"}</code></p>
      </div>
    </div>
  );
};

export default CMSVisualEditor;