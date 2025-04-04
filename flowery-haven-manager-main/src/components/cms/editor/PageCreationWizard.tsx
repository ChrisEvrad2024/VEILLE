// src/components/cms/editor/PageCreationWizard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cmsService } from '@/services/cms.service';
import { Wand2, FileText, LayoutTemplate, Info } from 'lucide-react';
import BannerExample from './examples/BannerExample';
import SliderExample from './examples/SliderExample';
import PromotionExample from './examples/PromotionExample';
import { ComponentItem } from './DragDropEditor';

interface PageCreationWizardProps {
  openOnStart?: boolean;
}

const PageCreationWizard: React.FC<PageCreationWizardProps> = ({
  openOnStart = false
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(openOnStart);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Données du formulaire
  const [pageData, setPageData] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    type: 'page' as 'page' | 'section' | 'component',
    published: true,
    includeComponents: true,
    selectedComponents: [] as string[]
  });
  
  // Options de composants disponibles
  const componentOptions = [
    { id: 'banner', label: 'Bannière', component: BannerExample },
    { id: 'slider', label: 'Slider', component: SliderExample },
    { id: 'promotion', label: 'Promotion', component: PromotionExample }
  ];

  // Gestion du changement d'étape
  const handleNext = () => {
    // Validation selon l'étape
    if (step === 1) {
      if (!pageData.title) {
        toast.error('Le titre de la page est obligatoire');
        return;
      }
      if (!pageData.slug) {
        // Générer un slug depuis le titre
        const slug = generateSlug(pageData.title);
        setPageData({ ...pageData, slug });
      }
    }
    
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  // Générateur de slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // Mise à jour automatique du slug quand le titre change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    let slug = pageData.slug;
    
    // Générer un slug seulement si l'utilisateur n'a pas encore défini un slug personnalisé
    if (!pageData.slug || pageData.slug === generateSlug(pageData.title)) {
      slug = generateSlug(title);
    }
    
    setPageData({ ...pageData, title, slug });
  };

  // Gestion du titre méta
  const handleMetaTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageData({ ...pageData, metaTitle: e.target.value });
  };

  // Gestion des composants sélectionnés
  const handleComponentToggle = (componentId: string, checked: boolean) => {
    if (checked) {
      setPageData({
        ...pageData,
        selectedComponents: [...pageData.selectedComponents, componentId]
      });
    } else {
      setPageData({
        ...pageData,
        selectedComponents: pageData.selectedComponents.filter(id => id !== componentId)
      });
    }
  };

  // Création de la page
  const handleCreatePage = async () => {
    try {
      setLoading(true);
      
      // Récupérer les instances de composants sélectionnés
      const components: ComponentItem[] = [];
      let orderCounter = 0;
      
      if (pageData.includeComponents) {
        // Parcourir les composants sélectionnés et créer des instances
        for (const componentId of pageData.selectedComponents) {
          const componentOption = componentOptions.find(opt => opt.id === componentId);
          if (componentOption) {
            // Créer une instance temporaire qu'on ne va pas afficher
            let tempComponent: ComponentItem | null = null;
            
            // Utiliser un callback pour récupérer l'instance
            const captureComponent = (comp: ComponentItem) => {
              tempComponent = comp;
            };
            
            // Rendre le composant d'exemple pour obtenir une instance (un peu hacky mais fonctionnel)
            const ExampleComponent = componentOption.component;
            const element = <ExampleComponent onSelect={captureComponent} />;
            
            // Simuler un click
            if (typeof (element.props as any).onSelect === 'function') {
              (element.props as any).onSelect({
                id: `${componentId}-${Date.now()}-${orderCounter}`,
                type: componentId,
                content: {},
                settings: {},
                order: orderCounter * 10
              });
            }
            
            // Si on a récupéré un composant, l'ajouter à la liste
            if (tempComponent) {
              components.push({
                ...tempComponent,
                order: orderCounter * 10
              });
              
              orderCounter++;
            }
          }
        }
      }
      
      // Générer le contenu avec les balises de composants
      let content = "";
      
      components.forEach((component) => {
        // Créer un objet avec le contenu et les paramètres
        const componentData = {
          content: component.content,
          settings: component.settings
        };
        
        // Ajouter la balise de composant au contenu
        content += `\n<!-- component:${component.id}:${component.order}:${JSON.stringify(componentData)} -->`;
      });
      
      // Créer la page
      const newPage = await cmsService.createPage(
        pageData.title,
        pageData.slug,
        content,
        {
          metaTitle: pageData.metaTitle || pageData.title,
          metaDescription: pageData.metaDescription,
          published: pageData.published,
          type: pageData.type
        }
      );
      
      toast.success('Page créée avec succès !');
      
      // Fermer l'assistant
      setOpen(false);
      
      // Rediriger vers l'éditeur visuel de la nouvelle page
      navigate(`/admin/cms/${newPage.id}/visual-editor`);
    } catch (error) {
      console.error('Erreur lors de la création de la page:', error);
      toast.error('Erreur lors de la création de la page');
    } finally {
      setLoading(false);
    }
  };

  // Aperçu de la page
  const renderPreview = () => {
    return (
      <div className="border rounded-md p-4">
        <h3 className="font-medium text-xl mb-2">{pageData.title}</h3>
        <p className="text-sm text-muted-foreground mb-1">URL: /{pageData.slug}</p>
        <p className="text-sm text-muted-foreground mb-1">Type: {pageData.type}</p>
        <p className="text-sm text-muted-foreground mb-4">Statut: {pageData.published ? 'Publié' : 'Brouillon'}</p>
        
        {pageData.includeComponents && pageData.selectedComponents.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Composants inclus:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {pageData.selectedComponents.map(compId => {
                const comp = componentOptions.find(opt => opt.id === compId);
                return comp ? (
                  <li key={compId} className="text-sm">{comp.label}</li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Rendu selon l'étape
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la page</Label>
              <Input
                id="title"
                value={pageData.title}
                onChange={handleTitleChange}
                placeholder="Ex: À propos de nous"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-1">/</span>
                <Input
                  id="slug"
                  value={pageData.slug}
                  onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                  placeholder="a-propos"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                L'identifiant unique qui formera l'URL de la page
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Type de page</Label>
              <RadioGroup
                value={pageData.type}
                onValueChange={(value) => setPageData({ ...pageData, type: value as 'page' | 'section' | 'component' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="page" id="page-type" />
                  <Label htmlFor="page-type" className="cursor-pointer">Page complète</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="section" id="section-type" />
                  <Label htmlFor="section-type" className="cursor-pointer">Section</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="published"
                checked={pageData.published}
                onCheckedChange={(checked) => setPageData({ ...pageData, published: !!checked })}
              />
              <Label htmlFor="published" className="cursor-pointer">Publier immédiatement</Label>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Titre SEO</Label>
              <Input
                id="metaTitle"
                value={pageData.metaTitle}
                onChange={handleMetaTitleChange}
                placeholder="Titre pour les moteurs de recherche"
              />
              <p className="text-xs text-muted-foreground">
                Si laissé vide, le titre de la page sera utilisé
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Description SEO</Label>
              <Input
                id="metaDescription"
                value={pageData.metaDescription}
                onChange={(e) => setPageData({ ...pageData, metaDescription: e.target.value })}
                placeholder="Description pour les moteurs de recherche"
              />
              <p className="text-xs text-muted-foreground">
                Une description concise qui apparaîtra dans les résultats de recherche
              </p>
            </div>
            
            {/* Aperçu SEO */}
            <div className="mt-6 p-4 border rounded-md">
              <h3 className="text-sm font-medium mb-2">Aperçu dans les résultats de recherche</h3>
              <div className="p-4 bg-white border rounded-md">
                <div className="text-blue-600 text-lg font-medium truncate">
                  {pageData.metaTitle || pageData.title || "Titre de la page"}
                </div>
                <div className="text-green-700 text-sm">
                  www.votresite.com/{pageData.slug}
                </div>
                <div className="text-gray-600 text-sm line-clamp-2 mt-1">
                  {pageData.metaDescription || "Aucune description fournie. Ajoutez une meta description pour améliorer votre référencement."}
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="include-components"
                checked={pageData.includeComponents}
                onCheckedChange={(checked) => setPageData({ ...pageData, includeComponents: !!checked })}
              />
              <Label htmlFor="include-components" className="cursor-pointer">Inclure des composants prédéfinis</Label>
            </div>
            
            {pageData.includeComponents && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sélectionnez les composants à inclure</Label>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {componentOptions.map((comp) => (
                      <div 
                        key={comp.id}
                        className={`border rounded-md p-3 cursor-pointer ${
                          pageData.selectedComponents.includes(comp.id)
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleComponentToggle(
                          comp.id, 
                          !pageData.selectedComponents.includes(comp.id)
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={pageData.selectedComponents.includes(comp.id)}
                            onCheckedChange={(checked) => handleComponentToggle(comp.id, !!checked)}
                          />
                          <Label className="cursor-pointer">{comp.label}</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">
                  Vous pourrez personnaliser ces composants après la création de la page.
                </p>
              </div>
            )}
            
            {!pageData.includeComponents && (
              <div className="flex flex-col items-center justify-center p-8 border rounded-md border-dashed">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Aucun composant ne sera ajouté. Vous pourrez les ajouter manuellement dans l'éditeur.
                </p>
              </div>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4 py-4">
            <h3 className="font-medium mb-4">Récapitulatif de la page</h3>
            {renderPreview()}
            
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleCreatePage}
                disabled={loading}
                className="w-full max-w-md"
              >
                {loading ? 'Création en cours...' : 'Créer la page et ouvrir l\'éditeur'}
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Assistant de page
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assistant de création de page</DialogTitle>
          <DialogDescription>
            Créez rapidement une nouvelle page en quelques étapes simples
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={`step-${step}`} className="mt-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="step-1" onClick={() => setStep(1)} disabled={loading}>
              Info
            </TabsTrigger>
            <TabsTrigger value="step-2" onClick={() => setStep(2)} disabled={!pageData.title || loading}>
              SEO
            </TabsTrigger>
            <TabsTrigger value="step-3" onClick={() => setStep(3)} disabled={!pageData.title || loading}>
              Contenu
            </TabsTrigger>
            <TabsTrigger value="step-4" onClick={() => setStep(4)} disabled={!pageData.title || loading}>
              Finaliser
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={`step-${step}`}>
            {renderStep()}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="gap-2 sm:gap-0">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={loading}
            >
              Précédent
            </Button>
          )}
          
          {step < 4 && (
            <Button onClick={handleNext}>
              Suivant
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PageCreationWizard;