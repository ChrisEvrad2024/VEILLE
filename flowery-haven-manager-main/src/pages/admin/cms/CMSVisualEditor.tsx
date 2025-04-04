// src/pages/admin/cms/CMSVisualEditor.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  Save,
  Plus,
  Settings,
  Edit,
  Trash2,
  Image,
  PlusCircle,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { cmsService, PageContent } from "@/services/cms.service";
import { cmsFrontendService } from "@/services/cms-frontend.service";

// Types pour les composants
interface ComponentItem {
  id: string;
  type: string;
  content: any;
  settings: any;
  order: number;
}

const CMSVisualEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageContent | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  // Charger la page et ses composants
  useEffect(() => {
    if (id) {
      loadPage(id);
    }
  }, [id]);

  const loadPage = async (pageId: string) => {
    try {
      setIsLoading(true);

      // Charger les données de la page
      const pageData = await cmsService.getPageById(pageId);

      if (!pageData) {
        toast.error("Page non trouvée");
        navigate("/admin/cms");
        return;
      }

      setPage(pageData);

      // Analyser les composants
      const pageComponents = cmsFrontendService.parsePageComponents(
        pageData.content
      );

      // Récupérer les données de chaque composant
      const componentsPromises = pageComponents.map(async (comp) => {
        try {
          // Charge les données du composant
          const componentData = await cmsFrontendService.getComponentData(
            comp.id,
            comp.options
          );

          if (!componentData) {
            return null;
          }

          return {
            id: comp.id,
            type: componentData.type,
            content: componentData.content,
            settings: componentData.settings,
            order: comp.order || 0,
          };
        } catch (error) {
          console.error(
            `Erreur lors du chargement du composant ${comp.id}:`,
            error
          );
          return null;
        }
      });

      // Attendre le chargement de tous les composants
      const componentsData = await Promise.all(componentsPromises);

      // Filtrer les composants valides et les trier par ordre
      const validComponents = componentsData
        .filter((comp): comp is ComponentItem => comp !== null)
        .sort((a, b) => a.order - b.order);

      setComponents(validComponents);
    } catch (error) {
      console.error("Erreur lors du chargement de la page:", error);
      toast.error("Erreur lors du chargement de la page");
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer le retour à la page précédente
  const handleBackClick = () => {
    navigate("/admin/cms");
  };

  // Prévisualiser la page
  const handlePreview = () => {
    if (page) {
      window.open(`/${page.slug}`, "_blank");
    }
  };

  // Ajouter un nouveau composant
  const handleAddComponent = (type: string) => {
    // Créer un nouveau composant avec des valeurs par défaut
    const newComponent: ComponentItem = {
      id: `${type}-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      settings: getDefaultSettings(type),
      order: components.length * 10,
    };

    // Ajouter à la liste des composants
    setComponents([...components, newComponent]);

    // Sélectionner le nouveau composant
    setSelectedComponent(newComponent);

    toast.success(`Composant ${type} ajouté avec succès`);
  };

  // Obtenir le contenu par défaut selon le type de composant
  const getDefaultContent = (type: string): any => {
    switch (type) {
      case "banner":
        return {
          title: "Bienvenue chez Flowery Haven",
          subtitle: "Des fleurs fraîches pour toutes les occasions",
          buttonText: "Découvrir notre collection",
          buttonLink: "/catalog",
          image: "/assets/logo.jpeg",
        };
      case "slider":
        return {
          slides: [
            {
              title: "Collection printemps",
              description: "Découvrez notre nouvelle collection",
              image: "/assets/logo.jpeg",
            },
            {
              title: "Livraison gratuite",
              description: "Pour toute commande supérieure à 50€",
              image: "/assets/logo.jpeg",
            },
          ],
        };
      case "promotion":
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
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        };
      default:
        return {};
    }
  };

  // Obtenir les paramètres par défaut selon le type de composant
  const getDefaultSettings = (type: string): any => {
    switch (type) {
      case "banner":
        return {
          fullWidth: true,
          height: "medium",
          textColor: "#ffffff",
        };
      case "slider":
        return {
          autoplay: true,
          interval: 5000,
          showDots: true,
        };
      case "promotion":
        return {
          fullWidth: true,
          layout: "horizontal",
          rounded: true,
          showBadge: true,
          badgeText: "PROMO",
          animateBadge: true,
          shadow: true,
        };
      default:
        return {};
    }
  };

  // Mettre à jour un composant
  const updateComponent = (updatedComponent: ComponentItem) => {
    setComponents(
      components.map((comp) =>
        comp.id === updatedComponent.id ? updatedComponent : comp
      )
    );
  };

  // Supprimer un composant
  const handleDeleteComponent = (componentId: string) => {
    setComponents(components.filter((comp) => comp.id !== componentId));

    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }

    toast.success("Composant supprimé");
  };

  // Déplacer un composant vers le haut
  const moveComponentUp = (index: number) => {
    if (index === 0) return;

    const newComponents = [...components];
    [newComponents[index - 1], newComponents[index]] = [
      newComponents[index],
      newComponents[index - 1],
    ];

    // Réassigner les ordres
    newComponents.forEach((comp, idx) => {
      comp.order = idx * 10;
    });

    setComponents(newComponents);
  };

  // Déplacer un composant vers le bas
  const moveComponentDown = (index: number) => {
    if (index === components.length - 1) return;

    const newComponents = [...components];
    [newComponents[index], newComponents[index + 1]] = [
      newComponents[index + 1],
      newComponents[index],
    ];

    // Réassigner les ordres
    newComponents.forEach((comp, idx) => {
      comp.order = idx * 10;
    });

    setComponents(newComponents);
  };

  // Enregistrer les modifications
  const handleSave = async () => {
    if (!id) return;

    try {
      setIsSaving(true);

      // Trier les composants par ordre
      const sortedComponents = [...components].sort(
        (a, b) => a.order - b.order
      );

      // Générer le contenu avec les balises de composants
      let content = "";

      sortedComponents.forEach((component) => {
        // Créer un objet avec le contenu et les paramètres
        const componentData = {
          content: component.content,
          settings: component.settings,
        };

        // Ajouter la balise de composant au contenu
        content += `\n<!-- component:${component.id}:${
          component.order
        }:${JSON.stringify(componentData)} -->`;
      });

      // Mettre à jour la page
      await cmsService.updatePage(id, {
        content,
      });

      toast.success("Page mise à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la page:", error);
      toast.error("Erreur lors de la sauvegarde de la page");
    } finally {
      setIsSaving(false);
    }
  };

  // Composant d'édition pour un composant sélectionné
  const ComponentEditor = () => {
    if (!selectedComponent) {
      return (
        <div className="p-4 text-center text-muted-foreground border rounded-md">
          Sélectionnez un composant pour le modifier
        </div>
      );
    }

    const [activeTab, setActiveTab] = useState("content");

    // Mise à jour du contenu
    const handleContentChange = (key: string, value: any) => {
      const updatedComponent = {
        ...selectedComponent,
        content: {
          ...selectedComponent.content,
          [key]: value,
        },
      };

      updateComponent(updatedComponent);
      setSelectedComponent(updatedComponent);
    };

    // Mise à jour des paramètres
    const handleSettingsChange = (key: string, value: any) => {
      const updatedComponent = {
        ...selectedComponent,
        settings: {
          ...selectedComponent.settings,
          [key]: value,
        },
      };

      updateComponent(updatedComponent);
      setSelectedComponent(updatedComponent);
    };

    // Rendu des champs d'édition selon le type de composant
    const renderContentFields = () => {
      switch (selectedComponent.type) {
        case "banner":
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="banner-title">Titre</Label>
                <Input
                  id="banner-title"
                  value={selectedComponent.content.title || ""}
                  onChange={(e) => handleContentChange("title", e.target.value)}
                  placeholder="Titre de la bannière"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-subtitle">Sous-titre</Label>
                <Textarea
                  id="banner-subtitle"
                  value={selectedComponent.content.subtitle || ""}
                  onChange={(e) =>
                    handleContentChange("subtitle", e.target.value)
                  }
                  placeholder="Sous-titre de la bannière"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-image">Image (URL)</Label>
                <Input
                  id="banner-image"
                  value={selectedComponent.content.image || ""}
                  onChange={(e) => handleContentChange("image", e.target.value)}
                  placeholder="URL de l'image"
                />
                {selectedComponent.content.image && (
                  <div className="mt-2 relative border rounded-md overflow-hidden aspect-video">
                    <img
                      src={selectedComponent.content.image}
                      alt="Aperçu"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-button-text">Texte du bouton</Label>
                <Input
                  id="banner-button-text"
                  value={selectedComponent.content.buttonText || ""}
                  onChange={(e) =>
                    handleContentChange("buttonText", e.target.value)
                  }
                  placeholder="Texte du bouton"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-button-link">Lien du bouton</Label>
                <Input
                  id="banner-button-link"
                  value={selectedComponent.content.buttonLink || ""}
                  onChange={(e) =>
                    handleContentChange("buttonLink", e.target.value)
                  }
                  placeholder="URL du lien"
                />
              </div>
            </div>
          );

        case "promotion":
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promotion-title">Titre</Label>
                <Input
                  id="promotion-title"
                  value={selectedComponent.content.title || ""}
                  onChange={(e) => handleContentChange("title", e.target.value)}
                  placeholder="Titre de la promotion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion-subtitle">Sous-titre</Label>
                <Input
                  id="promotion-subtitle"
                  value={selectedComponent.content.subtitle || ""}
                  onChange={(e) =>
                    handleContentChange("subtitle", e.target.value)
                  }
                  placeholder="Sous-titre de la promotion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion-description">Description</Label>
                <Textarea
                  id="promotion-description"
                  value={selectedComponent.content.description || ""}
                  onChange={(e) =>
                    handleContentChange("description", e.target.value)
                  }
                  placeholder="Description de la promotion"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion-image">Image (URL)</Label>
                <Input
                  id="promotion-image"
                  value={selectedComponent.content.image || ""}
                  onChange={(e) => handleContentChange("image", e.target.value)}
                  placeholder="URL de l'image"
                />
                {selectedComponent.content.image && (
                  <div className="mt-2 relative border rounded-md overflow-hidden aspect-video">
                    <img
                      src={selectedComponent.content.image}
                      alt="Aperçu"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="promotion-bgcolor">Couleur de fond</Label>
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-8 h-8 rounded-md border"
                      style={{
                        backgroundColor:
                          selectedComponent.content.backgroundColor ||
                          "#ff5252",
                      }}
                    ></div>
                    <Input
                      id="promotion-bgcolor"
                      type="color"
                      value={
                        selectedComponent.content.backgroundColor || "#ff5252"
                      }
                      onChange={(e) =>
                        handleContentChange("backgroundColor", e.target.value)
                      }
                      className="w-10 h-8 p-0"
                    />
                    <Input
                      value={
                        selectedComponent.content.backgroundColor || "#ff5252"
                      }
                      onChange={(e) =>
                        handleContentChange("backgroundColor", e.target.value)
                      }
                      className="w-28"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promotion-textcolor">Couleur du texte</Label>
                  <div className="flex gap-2 items-center">
                    <div
                      className="w-8 h-8 rounded-md border"
                      style={{
                        backgroundColor:
                          selectedComponent.content.textColor || "#ffffff",
                      }}
                    ></div>
                    <Input
                      id="promotion-textcolor"
                      type="color"
                      value={selectedComponent.content.textColor || "#ffffff"}
                      onChange={(e) =>
                        handleContentChange("textColor", e.target.value)
                      }
                      className="w-10 h-8 p-0"
                    />
                    <Input
                      value={selectedComponent.content.textColor || "#ffffff"}
                      onChange={(e) =>
                        handleContentChange("textColor", e.target.value)
                      }
                      className="w-28"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion-discount">Remise affichée</Label>
                <Input
                  id="promotion-discount"
                  value={selectedComponent.content.discount || ""}
                  onChange={(e) =>
                    handleContentChange("discount", e.target.value)
                  }
                  placeholder="Ex: -20%"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion-cta-text">Texte du bouton</Label>
                <Input
                  id="promotion-cta-text"
                  value={selectedComponent.content.ctaText || ""}
                  onChange={(e) =>
                    handleContentChange("ctaText", e.target.value)
                  }
                  placeholder="Texte du bouton"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion-cta-link">Lien du bouton</Label>
                <Input
                  id="promotion-cta-link"
                  value={selectedComponent.content.ctaLink || ""}
                  onChange={(e) =>
                    handleContentChange("ctaLink", e.target.value)
                  }
                  placeholder="URL du lien"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion-expiry">Date d'expiration</Label>
                <Input
                  id="promotion-expiry"
                  type="date"
                  value={selectedComponent.content.expiryDate || ""}
                  onChange={(e) =>
                    handleContentChange("expiryDate", e.target.value)
                  }
                />
              </div>
            </div>
          );

        // Cas pour les autres types de composants...
        default:
          return (
            <div className="p-4 text-center text-muted-foreground border rounded-md">
              Configuration non disponible pour ce type de composant
            </div>
          );
      }
    };

    // Rendu des champs de paramètres selon le type de composant
    const renderSettingsFields = () => {
      switch (selectedComponent.type) {
        case "banner":
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="banner-fullwidth">Pleine largeur</Label>
                <Switch
                  id="banner-fullwidth"
                  checked={selectedComponent.settings.fullWidth !== false}
                  onCheckedChange={(checked) =>
                    handleSettingsChange("fullWidth", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-height">Hauteur</Label>
                <select
                  id="banner-height"
                  value={selectedComponent.settings.height || "medium"}
                  onChange={(e) =>
                    handleSettingsChange("height", e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="small">Petite</option>
                  <option value="medium">Moyenne</option>
                  <option value="large">Grande</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-textcolor">Couleur du texte</Label>
                <div className="flex gap-2 items-center">
                  <div
                    className="w-8 h-8 rounded-md border"
                    style={{
                      backgroundColor:
                        selectedComponent.settings.textColor || "#ffffff",
                    }}
                  ></div>
                  <Input
                    id="banner-textcolor"
                    type="color"
                    value={selectedComponent.settings.textColor || "#ffffff"}
                    onChange={(e) =>
                      handleSettingsChange("textColor", e.target.value)
                    }
                    className="w-10 h-8 p-0"
                  />
                  <Input
                    value={selectedComponent.settings.textColor || "#ffffff"}
                    onChange={(e) =>
                      handleSettingsChange("textColor", e.target.value)
                    }
                    className="w-28"
                  />
                </div>
              </div>
            </div>
          );

        case "promotion":
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="promotion-fullwidth">Pleine largeur</Label>
                <Switch
                  id="promotion-fullwidth"
                  checked={selectedComponent.settings.fullWidth !== false}
                  onCheckedChange={(checked) =>
                    handleSettingsChange("fullWidth", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion-layout">Disposition</Label>
                <select
                  id="promotion-layout"
                  value={selectedComponent.settings.layout || "horizontal"}
                  onChange={(e) =>
                    handleSettingsChange("layout", e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="horizontal">Horizontale</option>
                  <option value="vertical">Verticale</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="promotion-rounded">Coins arrondis</Label>
                <Switch
                  id="promotion-rounded"
                  checked={selectedComponent.settings.rounded !== false}
                  onCheckedChange={(checked) =>
                    handleSettingsChange("rounded", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="promotion-shadow">Ombre</Label>
                <Switch
                  id="promotion-shadow"
                  checked={selectedComponent.settings.shadow !== false}
                  onCheckedChange={(checked) =>
                    handleSettingsChange("shadow", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="promotion-badge">Afficher le badge</Label>
                <Switch
                  id="promotion-badge"
                  checked={selectedComponent.settings.showBadge !== false}
                  onCheckedChange={(checked) =>
                    handleSettingsChange("showBadge", checked)
                  }
                />
              </div>

              {selectedComponent.settings.showBadge && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="promotion-badge-text">Texte du badge</Label>
                    <Input
                      id="promotion-badge-text"
                      value={selectedComponent.settings.badgeText || "PROMO"}
                      onChange={(e) =>
                        handleSettingsChange("badgeText", e.target.value)
                      }
                      placeholder="Texte du badge"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="promotion-badge-animate">
                      Animer le badge
                    </Label>
                    <Switch
                      id="promotion-badge-animate"
                      checked={
                        selectedComponent.settings.animateBadge !== false
                      }
                      onCheckedChange={(checked) =>
                        handleSettingsChange("animateBadge", checked)
                      }
                    />
                  </div>
                </>
              )}
            </div>
          );

        // Cas pour les autres types de composants...
        default:
          return (
            <div className="p-4 text-center text-muted-foreground border rounded-md">
              Configuration non disponible pour ce type de composant
            </div>
          );
      }
    };

    return (
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 py-4">
            {renderContentFields()}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 py-4">
            {renderSettingsFields()}
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t flex justify-between">
          <Button
            variant="destructive"
            onClick={() => handleDeleteComponent(selectedComponent.id)}
            className="flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>
    );
  };

  // Rendu d'un aperçu visuel du composant
  const renderComponentPreview = (component: ComponentItem) => {
    // Cette fonction est simplifiée et ne rend qu'un aperçu basique
    // Dans une implementation complète, nous utiliserions les vrais composants

    switch (component.type) {
      case "banner":
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
                <p className="text-sm text-white mb-2">
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

      case "promotion":
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
                  <h3 className="font-bold">{component.content.title}</h3>
                  <p className="text-sm mb-2">{component.content.subtitle}</p>
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

      case "slider":
        return (
          <div className="relative p-4 bg-muted/30 border rounded-md overflow-hidden">
            <div className="relative aspect-[3/1] overflow-hidden rounded">
              {component.content.slides &&
                component.content.slides.length > 0 && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${component.content.slides[0].image})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                  </div>
                )}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
                <h3 className="text-lg font-bold mb-1 text-white">
                  {component.content.slides?.[0]?.title || "Titre du slide"}
                </h3>
                <p className="text-sm text-white mb-2">
                  {component.content.slides?.[0]?.description ||
                    "Description du slide"}
                </p>
              </div>
              {component.settings.showDots && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {component.content.slides?.map((_: any, i: number) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === 0 ? "bg-white" : "bg-white/50"
                      }`}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 text-center text-muted-foreground border rounded-md">
            Aperçu non disponible pour ce type de composant
          </div>
        );
    }
  };

  // Génération de HTML pour la prévisualisation complète
  const generatePreviewHTML = () => {
    // Trier les composants par ordre
    const sortedComponents = [...components].sort((a, b) => a.order - b.order);

    // En-tête du HTML
    let html = `
      <html>
      <head>
        <style>
          body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
          .component { margin-bottom: 20px; }
          .container { max-width: 1200px; margin: 0 auto; }
        </style>
      </head>
      <body>
    `;

    // Ajouter chaque composant
    sortedComponents.forEach((component) => {
      html += `<div class="component">`;

      switch (component.type) {
        case "banner":
          html += `
            <div style="position: relative; height: 300px; overflow: hidden; ${
              component.settings.fullWidth
                ? "width: 100%"
                : "max-width: 1200px; margin: 0 auto"
            };">
              <div style="position: absolute; inset: 0; background-image: url(${
                component.content.image
              }); background-size: cover; background-position: center;">
                <div style="position: absolute; inset: 0; background-color: rgba(0,0,0,0.4);"></div>
              </div>
              <div style="position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0 20px;">
                <h2 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; color: ${
                  component.settings.textColor || "#ffffff"
                };">${component.content.title}</h2>
                <p style="font-size: 1.25rem; max-width: 800px; margin-bottom: 1.5rem; color: ${
                  component.settings.textColor || "#ffffff"
                };">${component.content.subtitle}</p>
                <a href="${
                  component.content.buttonLink
                }" style="display: inline-block; background-color: #10b981; color: white; padding: 0.75rem 1.5rem; border-radius: 0.375rem; text-decoration: none; font-weight: 500;">${
            component.content.buttonText
          }</a>
              </div>
            </div>
          `;
          break;

        case "promotion":
          html += `
            <div style="position: relative; overflow: hidden; margin: 2rem 0; ${
              component.settings.fullWidth
                ? "width: 100%"
                : "max-width: 1200px; margin: 2rem auto"
            }; ${component.settings.rounded ? "border-radius: 0.5rem" : ""}; ${
            component.settings.shadow
              ? "box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)"
              : ""
          };">
              <div style="display: flex; ${
                component.settings.layout === "vertical"
                  ? "flex-direction: column"
                  : "flex-direction: row"
              }; background-color: ${component.content.backgroundColor};">
                ${
                  component.content.image
                    ? `
                  <div style="${
                    component.settings.layout === "horizontal"
                      ? "width: 33%"
                      : "width: 100%"
                  }; overflow: hidden;">
                    <img src="${component.content.image}" alt="${
                        component.content.title
                      }" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                `
                    : ""
                }
                <div style="padding: 2rem; ${
                  component.settings.layout === "horizontal"
                    ? "width: 67%"
                    : "width: 100%"
                };">
                  ${
                    component.content.discount
                      ? `<div style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; color: ${component.content.textColor};">${component.content.discount}</div>`
                      : ""
                  }
                  <h3 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; color: ${
                    component.content.textColor
                  };">${component.content.title}</h3>
                  <div style="font-size: 1.25rem; margin-bottom: 1rem; color: ${
                    component.content.textColor
                  };">${component.content.subtitle}</div>
                  <p style="margin-bottom: 1.5rem; color: ${
                    component.content.textColor
                  };">${component.content.description}</p>
                  <a href="${
                    component.content.ctaLink
                  }" style="display: inline-block; background-color: white; color: black; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none; font-weight: 500;">${
            component.content.ctaText
          }</a>
                </div>
              </div>
              ${
                component.settings.showBadge
                  ? `
                <div style="position: absolute; top: 0; right: 0; background-color: #ef4444; color: white; padding: 0.25rem 0.75rem; font-weight: bold; font-size: 0.75rem; text-transform: uppercase; ${
                  component.settings.animateBadge
                    ? "animation: pulse 2s infinite;"
                    : ""
                }">
                  ${component.settings.badgeText}
                </div>
              `
                  : ""
              }
            </div>
          `;
          break;

        case "slider":
          if (component.content.slides && component.content.slides.length > 0) {
            html += `
              <div style="position: relative; height: 300px; overflow: hidden; margin-bottom: 20px;">
                ${component.content.slides
                  .map(
                    (slide: any, index: number) => `
                  <div style="position: absolute; inset: 0; ${
                    index === 0
                      ? "opacity: 1"
                      : "opacity: 0; pointer-events: none"
                  }; transition: opacity 0.5s;">
                    <div style="position: absolute; inset: 0; background-image: url(${
                      slide.image
                    }); background-size: cover; background-position: center;">
                      <div style="position: absolute; inset: 0; background-color: rgba(0,0,0,0.3);"></div>
                    </div>
                    <div style="position: relative; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; padding: 0 20px; color: white;">
                      <h3 style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">${
                        slide.title
                      }</h3>
                      <p style="font-size: 1rem; max-width: 800px;">${
                        slide.description
                      }</p>
                    </div>
                  </div>
                `
                  )
                  .join("")}
                ${
                  component.settings.showDots &&
                  component.content.slides.length > 1
                    ? `
                  <div style="position: absolute; bottom: 1rem; left: 0; right: 0; display: flex; justify-content: center; gap: 0.5rem;">
                    ${component.content.slides
                      .map(
                        (_: any, index: number) => `
                      <button style="width: 0.75rem; height: 0.75rem; border-radius: 50%; background-color: ${
                        index === 0 ? "white" : "rgba(255, 255, 255, 0.5)"
                      }; border: none;"></button>
                    `
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }
              </div>
            `;
          }
          break;

        default:
          html += `<div style="padding: 1rem; margin: 1rem 0; border: 1px dashed #ccc; text-align: center;">Composant de type "${component.type}"</div>`;
      }

      html += `</div>`;
    });

    // Pied de page du HTML
    html += `
      </body>
      </html>
    `;

    return html;
  };

  // Ouvrir la prévisualisation HTML
  const openPreview = () => {
    setPreviewContent(generatePreviewHTML());
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading
                ? "Chargement..."
                : page
                ? `Éditer: ${page.title}`
                : "Éditeur visuel"}
            </h1>
            {page && (
              <p className="text-muted-foreground font-mono text-sm">
                /{page.slug === "home" ? "" : page.slug}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={openPreview}
            disabled={isLoading || components.length === 0}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Aperçu
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-[500px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Liste des composants */}
              <div className="lg:w-2/3 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Composants de la page</h2>
                  <div className="flex gap-2">
                    <div className="relative group">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un composant
                      </Button>

                      <div className="absolute right-0 mt-2 w-56 z-50 hidden group-hover:block">
                        <div className="bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 p-2 space-y-1">
                          <button
                            className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-muted/50"
                            onClick={() => handleAddComponent("banner")}
                          >
                            <Image className="h-4 w-4 mr-2 text-primary" />
                            Bannière
                          </button>
                          <button
                            className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-muted/50"
                            onClick={() => handleAddComponent("slider")}
                          >
                            <SlidersHorizontal className="h-4 w-4 mr-2 text-primary" />
                            Slider
                          </button>
                          <button
                            className="flex items-center w-full px-3 py-2 text-sm rounded-md hover:bg-muted/50"
                            onClick={() => handleAddComponent("promotion")}
                          >
                            <Tag className="h-4 w-4 mr-2 text-primary" />
                            Promotion
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {components.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-muted-foreground/20 rounded-md p-4">
                    <p className="text-muted-foreground text-center mb-4">
                      Ajoutez des composants pour créer votre page
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleAddComponent("banner")}
                        className="flex items-center gap-2"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Ajouter une bannière
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleAddComponent("promotion")}
                        className="flex items-center gap-2"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Ajouter une promotion
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {components
                      .sort((a, b) => a.order - b.order)
                      .map((component, index) => (
                        <div
                          key={component.id}
                          className={`border rounded-md overflow-hidden ${
                            selectedComponent?.id === component.id
                              ? "ring-2 ring-primary"
                              : "hover:ring-2 hover:ring-primary/50"
                          }`}
                          onClick={() => setSelectedComponent(component)}
                        >
                          <div className="flex items-center justify-between p-2 bg-muted/30 border-b">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {component.type === "banner" && (
                                <Image className="h-4 w-4" />
                              )}
                              {component.type === "slider" && (
                                <SlidersHorizontal className="h-4 w-4" />
                              )}
                              {component.type === "promotion" && (
                                <Tag className="h-4 w-4" />
                              )}
                              {component.type.charAt(0).toUpperCase() +
                                component.type.slice(1)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedComponent(component);
                                }}
                                title="Éditer"
                              >
                                <Settings className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveComponentUp(index);
                                }}
                                disabled={index === 0}
                                title="Déplacer vers le haut"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-3.5 w-3.5"
                                >
                                  <path d="m18 15-6-6-6 6" />
                                </svg>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveComponentDown(index);
                                }}
                                disabled={index === components.length - 1}
                                title="Déplacer vers le bas"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-3.5 w-3.5"
                                >
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteComponent(component.id);
                                }}
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-3">
                            {renderComponentPreview(component)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Panneau d'édition */}
              <div className="lg:w-1/3 bg-muted/20 rounded-md p-4">
                <h2 className="text-xl font-bold mb-4">
                  {selectedComponent
                    ? `Édition: ${
                        selectedComponent.type.charAt(0).toUpperCase() +
                        selectedComponent.type.slice(1)
                      }`
                    : "Propriétés"}
                </h2>

                {selectedComponent ? (
                  <ComponentEditor />
                ) : (
                  <div className="text-center text-muted-foreground p-8 border border-dashed rounded-md">
                    <Edit className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>
                      Sélectionnez un composant pour voir et modifier ses
                      propriétés
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de prévisualisation */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[80%] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de la page</DialogTitle>
            <DialogDescription>
              Prévisualisation avant publication
            </DialogDescription>
          </DialogHeader>
          <iframe
            srcDoc={previewContent}
            className="w-full h-[60vh] border rounded-md"
            title="Aperçu"
          ></iframe>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fermer
            </Button>
            <Button onClick={handlePreview}>
              Ouvrir dans un nouvel onglet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMSVisualEditor;
