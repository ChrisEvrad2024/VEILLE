// src/pages/admin/cms/ComponentManager.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ArrowLeft,
  RefreshCw,
  Check,
  Palette,
  Image,
  LayoutGrid,
  ShoppingCart,
  MessageSquare,
  Mail,
  Code,
  FileText,
  Video,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cmsService, CMSComponent } from "@/services/cms.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Pre-defined field types for component form
const FIELD_TYPES = [
  { value: "text", label: "Texte court" },
  { value: "textarea", label: "Texte long" },
  { value: "image", label: "Image" },
  { value: "link", label: "Lien" },
  { value: "number", label: "Nombre" },
  { value: "toggle", label: "Interrupteur" },
  { value: "select", label: "Liste déroulante" },
  { value: "color", label: "Couleur" },
];

// Component presets for quick start
const COMPONENT_PRESETS = {
  banner: {
    fields: [
      { name: "title", label: "Titre", type: "text", required: true },
      { name: "subtitle", label: "Sous-titre", type: "text" },
      { name: "image", label: "Image d'arrière-plan", type: "image" },
      { name: "buttonText", label: "Texte du bouton", type: "text" },
      { name: "buttonLink", label: "Lien du bouton", type: "link" },
    ],
    settings: [
      {
        name: "fullWidth",
        label: "Pleine largeur",
        type: "toggle",
        default: true,
      },
      {
        name: "height",
        label: "Hauteur",
        type: "select",
        options: ["small", "medium", "large"],
        default: "medium",
      },
      {
        name: "textColor",
        label: "Couleur du texte",
        type: "color",
        default: "#ffffff",
      },
    ],
  },
  slider: {
    fields: [
      {
        name: "slides",
        label: "Diapositives",
        type: "array",
        subfields: [
          { name: "title", label: "Titre", type: "text" },
          { name: "image", label: "Image", type: "image" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
    settings: [
      {
        name: "autoplay",
        label: "Lecture automatique",
        type: "toggle",
        default: true,
      },
      {
        name: "interval",
        label: "Intervalle (ms)",
        type: "number",
        default: 5000,
      },
      {
        name: "showDots",
        label: "Afficher les points",
        type: "toggle",
        default: true,
      },
    ],
  },
  newsletter: {
    fields: [
      {
        name: "title",
        label: "Titre",
        type: "text",
        default: "Abonnez-vous à notre newsletter",
      },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "buttonText",
        label: "Texte du bouton",
        type: "text",
        default: "S'abonner",
      },
    ],
    settings: [
      {
        name: "layout",
        label: "Disposition",
        type: "select",
        options: ["inline", "stacked"],
        default: "stacked",
      },
      {
        name: "backgroundColor",
        label: "Couleur de fond",
        type: "color",
        default: "#f3f4f6",
      },
    ],
  },
};

const ComponentManager = () => {
  const navigate = useNavigate();

  const [components, setComponents] = useState<CMSComponent[]>([]);
  const [filteredComponents, setFilteredComponents] = useState<CMSComponent[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Component dialog states
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [currentComponent, setCurrentComponent] =
    useState<Partial<CMSComponent> | null>(null);
  const [isNewComponent, setIsNewComponent] = useState(true);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteComponentId, setDeleteComponentId] = useState<string | null>(
    null
  );

  // Form UI state
  const [activeTab, setActiveTab] = useState<string>("content");
  const [componentFields, setComponentFields] = useState<any[]>([]);
  const [componentSettings, setComponentSettings] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<any>({
    content: {},
    settings: {},
  });

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setIsLoading(true);
    try {
      // Load all components
      const allComponents = await cmsService.getAllComponents(false);
      setComponents(allComponents);

      // Apply initial filters
      applyFilters(allComponents, searchQuery, typeFilter);
    } catch (error) {
      console.error("Error loading components:", error);
      toast.error("Erreur lors du chargement des composants");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (
    allComponents: CMSComponent[],
    query: string,
    type: string
  ) => {
    let filtered = [...allComponents];

    // Apply search filter
    if (query) {
      filtered = filtered.filter((component) =>
        component.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply type filter
    if (type !== "all") {
      filtered = filtered.filter((component) => component.type === type);
    }

    setFilteredComponents(filtered);
  };

  // Update filters when they change
  useEffect(() => {
    applyFilters(components, searchQuery, typeFilter);
  }, [components, searchQuery, typeFilter]);

  // Handle filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Add/Edit component handlers
  const openAddComponentDialog = () => {
    setCurrentComponent({
      name: "",
      type: "banner",
      content: {},
      isActive: true,
      settings: {},
    });
    setComponentFields([]);
    setComponentSettings([]);
    setFormValues({ content: {}, settings: {} });
    setIsNewComponent(true);
    setIsComponentDialogOpen(true);
    setActiveTab("content");

    // We'll use a timeout to ensure the dialog is open before applying the preset
    setTimeout(() => {
      applyPreset("banner");
    }, 100);
  };

  const openEditComponentDialog = (component: CMSComponent) => {
    setCurrentComponent(component);
    setIsNewComponent(false);
    setIsComponentDialogOpen(true);
    setActiveTab("content");

    // Extract structure from component
    const fields: any[] = [];
    const settings: any[] = [];

    // Try to infer fields from content structure
    Object.entries(component.content || {}).forEach(([key, value]) => {
      const field: any = { name: key, value };

      // Try to determine type
      if (typeof value === "string") {
        if (
          value.startsWith("http") &&
          (value.includes(".jpg") ||
            value.includes(".png") ||
            value.includes(".jpeg") ||
            value.includes(".gif"))
        ) {
          field.type = "image";
        } else if (value.startsWith("http")) {
          field.type = "link";
        } else if (value.length > 50) {
          field.type = "textarea";
        } else {
          field.type = "text";
        }
      } else if (typeof value === "number") {
        field.type = "number";
      } else if (typeof value === "boolean") {
        field.type = "toggle";
      } else if (Array.isArray(value)) {
        field.type = "array";
        field.items = value;
      }

      field.label =
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
      fields.push(field);
    });

    // Try to infer settings from settings structure
    Object.entries(component.settings || {}).forEach(([key, value]) => {
      const setting: any = { name: key, value };

      // Try to determine type
      if (typeof value === "string") {
        if (value.startsWith("#")) {
          setting.type = "color";
        } else {
          setting.type = "text";
        }
      } else if (typeof value === "number") {
        setting.type = "number";
      } else if (typeof value === "boolean") {
        setting.type = "toggle";
      }

      setting.label =
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
      settings.push(setting);
    });

    setComponentFields(fields);
    setComponentSettings(settings);
    setFormValues({
      content: component.content || {},
      settings: component.settings || {},
    });
  };

  const applyPreset = (type: string) => {
    if (!COMPONENT_PRESETS[type as keyof typeof COMPONENT_PRESETS]) {
      return;
    }

    const preset = COMPONENT_PRESETS[type as keyof typeof COMPONENT_PRESETS];
    setComponentFields(preset.fields);
    setComponentSettings(preset.settings);

    // Initialize form values with defaults
    const contentDefaults = {};
    const settingsDefaults = {};

    preset.fields.forEach((field) => {
      if (field.default !== undefined) {
        (contentDefaults as any)[field.name] = field.default;
      }
    });

    preset.settings.forEach((setting) => {
      if (setting.default !== undefined) {
        (settingsDefaults as any)[setting.name] = setting.default;
      }
    });

    setFormValues({
      content: contentDefaults,
      settings: settingsDefaults,
    });

    if (currentComponent) {
      setCurrentComponent({
        ...currentComponent,
        type,
      });
    }
  };

  const handleFieldChange = (
    fieldName: string,
    value: any,
    isSettings: boolean = false
  ) => {
    setFormValues((prev) => {
      const section = isSettings ? "settings" : "content";
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [fieldName]: value,
        },
      };
    });
  };

  const addField = (isSettings: boolean = false) => {
    const newField = {
      name: `field${isSettings ? "Setting" : ""}${
        isSettings ? componentSettings.length + 1 : componentFields.length + 1
      }`,
      label: `Nouveau champ ${
        isSettings ? componentSettings.length + 1 : componentFields.length + 1
      }`,
      type: "text",
    };

    if (isSettings) {
      setComponentSettings([...componentSettings, newField]);
    } else {
      setComponentFields([...componentFields, newField]);
    }
  };

  const updateField = (
    index: number,
    field: any,
    isSettings: boolean = false
  ) => {
    if (isSettings) {
      const newSettings = [...componentSettings];
      newSettings[index] = field;
      setComponentSettings(newSettings);
    } else {
      const newFields = [...componentFields];
      newFields[index] = field;
      setComponentFields(newFields);
    }
  };

  const removeField = (index: number, isSettings: boolean = false) => {
    if (isSettings) {
      const newSettings = [...componentSettings];
      const removedField = newSettings.splice(index, 1)[0];
      setComponentSettings(newSettings);

      // Also remove the value
      setFormValues((prev) => {
        const newSettings = { ...prev.settings };
        delete newSettings[removedField.name];
        return { ...prev, settings: newSettings };
      });
    } else {
      const newFields = [...componentFields];
      const removedField = newFields.splice(index, 1)[0];
      setComponentFields(newFields);

      // Also remove the value
      setFormValues((prev) => {
        const newContent = { ...prev.content };
        delete newContent[removedField.name];
        return { ...prev, content: newContent };
      });
    }
  };

  const handleComponentSave = async () => {
    if (!currentComponent || !currentComponent.name || !currentComponent.type) {
      toast.error("Nom et type sont obligatoires");
      return;
    }

    try {
      // Prepare the component data
      const componentData = {
        ...currentComponent,
        content: formValues.content,
        settings: formValues.settings,
      };

      if (isNewComponent) {
        // Create new component
        const newComponent = await cmsService.createComponent(
          componentData.name!,
          componentData.type as CMSComponent["type"],
          componentData.content,
          componentData.settings
        );

        setComponents([...components, newComponent]);
        toast.success("Composant créé avec succès");
      } else {
        // Update existing component
        const updatedComponent = await cmsService.updateComponent(
          componentData.id!,
          {
            name: componentData.name,
            type: componentData.type as CMSComponent["type"],
            content: componentData.content,
            settings: componentData.settings,
            isActive: componentData.isActive,
          }
        );

        setComponents(
          components.map((c) =>
            c.id === updatedComponent.id ? updatedComponent : c
          )
        );
        toast.success("Composant mis à jour avec succès");
      }

      setIsComponentDialogOpen(false);
    } catch (error) {
      console.error("Error saving component:", error);
      toast.error("Erreur lors de l'enregistrement du composant");
    }
  };

  // Delete component handlers
  const openDeleteDialog = (componentId: string) => {
    setDeleteComponentId(componentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteComponentId) return;

    try {
      await cmsService.deleteComponent(deleteComponentId);

      setComponents(components.filter((c) => c.id !== deleteComponentId));
      setFilteredComponents(
        filteredComponents.filter((c) => c.id !== deleteComponentId)
      );

      toast.success("Composant supprimé avec succès");
      setIsDeleteDialogOpen(false);
      setDeleteComponentId(null);
    } catch (error) {
      console.error("Error deleting component:", error);
      toast.error("Erreur lors de la suppression du composant");
    }
  };

  // Toggle component active state
  const toggleComponentActive = async (component: CMSComponent) => {
    try {
      const updatedComponent = await cmsService.updateComponent(component.id, {
        isActive: !component.isActive,
      });

      setComponents(
        components.map((c) =>
          c.id === updatedComponent.id ? updatedComponent : c
        )
      );

      toast.success(
        updatedComponent.isActive
          ? "Composant activé avec succès"
          : "Composant désactivé avec succès"
      );
    } catch (error) {
      console.error("Error toggling component state:", error);
      toast.error("Erreur lors du changement d'état du composant");
    }
  };

  // Get icon for component type
  const getComponentTypeIcon = (type: string) => {
    switch (type) {
      case "banner":
        return <Image className="h-4 w-4" />;
      case "slider":
        return <LayoutGrid className="h-4 w-4" />;
      case "featured_products":
        return <ShoppingCart className="h-4 w-4" />;
      case "newsletter":
        return <Mail className="h-4 w-4" />;
      case "testimonials":
        return <MessageSquare className="h-4 w-4" />;
      case "text":
        return <FileText className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "html":
        return <Code className="h-4 w-4" />;
      default:
        return <Palette className="h-4 w-4" />;
    }
  };

  // Render a field editor based on its type
  const renderFieldEditor = (field: any, isSettings: boolean = false) => {
    const value = isSettings
      ? formValues.settings[field.name]
      : formValues.content[field.name];

    switch (field.type) {
      case "text":
        return (
          <Input
            value={value || ""}
            onChange={(e) =>
              handleFieldChange(field.name, e.target.value, isSettings)
            }
            placeholder={`Entrez ${field.label.toLowerCase()}`}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) =>
              handleFieldChange(field.name, e.target.value, isSettings)
            }
            placeholder={`Entrez ${field.label.toLowerCase()}`}
            rows={4}
          />
        );

      case "image":
        return (
          <div className="space-y-2">
            <Input
              value={value || ""}
              onChange={(e) =>
                handleFieldChange(field.name, e.target.value, isSettings)
              }
              placeholder="URL de l'image"
            />
            {value && (
              <div className="mt-2 relative border rounded-md overflow-hidden aspect-video">
                <img
                  src={value}
                  alt={field.label}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>
        );

      case "link":
        return (
          <Input
            value={value || ""}
            onChange={(e) =>
              handleFieldChange(field.name, e.target.value, isSettings)
            }
            placeholder="https://exemple.com"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) =>
              handleFieldChange(
                field.name,
                parseFloat(e.target.value),
                isSettings
              )
            }
            placeholder="0"
          />
        );

      case "toggle":
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) =>
              handleFieldChange(field.name, checked, isSettings)
            }
          />
        );

      case "select":
        return (
          <Select
            value={value || ""}
            onValueChange={(value) =>
              handleFieldChange(field.name, value, isSettings)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "color":
        return (
          <div className="flex gap-2 items-center">
            <div
              className="w-8 h-8 rounded-md border"
              style={{ backgroundColor: value || "#000000" }}
            ></div>
            <Input
              type="color"
              value={value || "#000000"}
              onChange={(e) =>
                handleFieldChange(field.name, e.target.value, isSettings)
              }
              className="w-16 h-8 p-0"
            />
            <Input
              value={value || ""}
              onChange={(e) =>
                handleFieldChange(field.name, e.target.value, isSettings)
              }
              className="w-24"
              placeholder="#000000"
            />
          </div>
        );

      case "array":
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {field.items?.length || 0} élément(s)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Handle array editing - in a real implementation, this would open a sub-dialog
                toast.info(
                  "L'édition des tableaux n'est pas implémentée dans cette démo. Utilisez l'onglet avancé."
                );
              }}
            >
              Éditer les éléments
            </Button>
          </div>
        );

      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) =>
              handleFieldChange(field.name, e.target.value, isSettings)
            }
            placeholder={`Entrez ${field.label.toLowerCase()}`}
          />
        );
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
            onClick={() => navigate("/admin/cms")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Composants</h1>
            <p className="text-muted-foreground">
              Gérez les composants réutilisables pour votre site.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddComponentDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau composant
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un composant..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="banner">Bannières</SelectItem>
                  <SelectItem value="slider">Sliders</SelectItem>
                  <SelectItem value="featured_products">
                    Produits en vedette
                  </SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="testimonials">Témoignages</SelectItem>
                  <SelectItem value="text">Texte</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Vidéo</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={resetFilters}
                title="Réinitialiser les filtres"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">
                Aucun composant trouvé
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || typeFilter !== "all"
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Commencez par créer votre premier composant"}
              </p>
              <Button
                className="mt-4"
                onClick={
                  searchQuery || typeFilter !== "all"
                    ? resetFilters
                    : openAddComponentDialog
                }
              >
                {searchQuery || typeFilter !== "all" ? (
                  <>Réinitialiser les filtres</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un composant
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Modifié le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComponents.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-medium">
                        {component.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 w-fit"
                        >
                          {getComponentTypeIcon(component.type)}
                          {component.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {component.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-800 border-gray-200"
                          >
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(component.createdAt.toString())}
                      </TableCell>
                      <TableCell>
                        {formatDate(component.updatedAt.toString())}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditComponentDialog(component)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleComponentActive(component)}
                            >
                              {component.isActive ? (
                                <>
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => openDeleteDialog(component.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Dialog - NEW USER-FRIENDLY VERSION */}
      <Dialog
        open={isComponentDialogOpen}
        onOpenChange={setIsComponentDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewComponent
                ? "Ajouter un composant"
                : "Modifier le composant"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="componentName">Nom</Label>
                <Input
                  id="componentName"
                  value={currentComponent?.name || ""}
                  onChange={(e) =>
                    setCurrentComponent({
                      ...currentComponent!,
                      name: e.target.value,
                    })
                  }
                  placeholder="Nom du composant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="componentType">Type</Label>
                <Select
                  value={currentComponent?.type || "banner"}
                  onValueChange={(value) => {
                    setCurrentComponent({
                      ...currentComponent!,
                      type: value as CMSComponent["type"],
                    });
                    applyPreset(value);
                  }}
                >
                  <SelectTrigger id="componentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Bannière</SelectItem>
                    <SelectItem value="slider">Slider</SelectItem>
                    <SelectItem value="featured_products">
                      Produits en vedette
                    </SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="testimonials">Témoignages</SelectItem>
                    <SelectItem value="text">Texte</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="settings">Paramètres</TabsTrigger>
                <TabsTrigger value="advanced">Avancé</TabsTrigger>
              </TabsList>

              {/* CONTENT TAB */}
              <TabsContent value="content" className="space-y-4 py-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField(false)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter un champ
                  </Button>
                </div>

                {componentFields.length === 0 && (
                  <div className="text-center py-8 border rounded-md">
                    <Palette className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
                    <p className="mt-2 text-muted-foreground">
                      Aucun champ défini. Ajoutez des champs de contenu pour ce
                      composant.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {componentFields.map((field, index) => (
                    <div
                      key={`content-field-${index}`}
                      className="border rounded-md p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">{field.label}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(index, false)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Identifiant</Label>
                            <Input
                              size="sm"
                              value={field.name}
                              onChange={(e) => {
                                // When changing the name, we need to move the value too
                                const oldName = field.name;
                                const newName = e.target.value;

                                updateField(
                                  index,
                                  { ...field, name: newName },
                                  false
                                );

                                // Update the form values
                                setFormValues((prev) => {
                                  const newContent = { ...prev.content };
                                  if (oldName in newContent) {
                                    newContent[newName] = newContent[oldName];
                                    delete newContent[oldName];
                                  }
                                  return { ...prev, content: newContent };
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) =>
                                updateField(
                                  index,
                                  { ...field, type: value },
                                  false
                                )
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Étiquette</Label>
                          <Input
                            size="sm"
                            value={field.label}
                            onChange={(e) =>
                              updateField(
                                index,
                                { ...field, label: e.target.value },
                                false
                              )
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Valeur</Label>
                          {renderFieldEditor(field, false)}
                        </div>

                        {field.type === "select" && (
                          <div className="space-y-1">
                            <Label className="text-xs">
                              Options (séparées par des virgules)
                            </Label>
                            <Input
                              size="sm"
                              value={field.options?.join(", ") || ""}
                              onChange={(e) => {
                                const options = e.target.value
                                  .split(",")
                                  .map((opt) => opt.trim());
                                updateField(
                                  index,
                                  { ...field, options },
                                  false
                                );
                              }}
                              placeholder="option1, option2, option3"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* SETTINGS TAB */}
              <TabsContent value="settings" className="space-y-4 py-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter un paramètre
                  </Button>
                </div>

                {componentSettings.length === 0 && (
                  <div className="text-center py-8 border rounded-md">
                    <Settings className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
                    <p className="mt-2 text-muted-foreground">
                      Aucun paramètre défini. Ajoutez des paramètres pour
                      configurer ce composant.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {componentSettings.map((setting, index) => (
                    <div
                      key={`setting-field-${index}`}
                      className="border rounded-md p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">{setting.label}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(index, true)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Identifiant</Label>
                            <Input
                              size="sm"
                              value={setting.name}
                              onChange={(e) => {
                                // When changing the name, we need to move the value too
                                const oldName = setting.name;
                                const newName = e.target.value;

                                updateField(
                                  index,
                                  { ...setting, name: newName },
                                  true
                                );

                                // Update the form values
                                setFormValues((prev) => {
                                  const newSettings = { ...prev.settings };
                                  if (oldName in newSettings) {
                                    newSettings[newName] = newSettings[oldName];
                                    delete newSettings[oldName];
                                  }
                                  return { ...prev, settings: newSettings };
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={setting.type}
                              onValueChange={(value) =>
                                updateField(
                                  index,
                                  { ...setting, type: value },
                                  true
                                )
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((type) => (
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Étiquette</Label>
                          <Input
                            size="sm"
                            value={setting.label}
                            onChange={(e) =>
                              updateField(
                                index,
                                { ...setting, label: e.target.value },
                                true
                              )
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Valeur</Label>
                          {renderFieldEditor(setting, true)}
                        </div>

                        {setting.type === "select" && (
                          <div className="space-y-1">
                            <Label className="text-xs">
                              Options (séparées par des virgules)
                            </Label>
                            <Input
                              size="sm"
                              value={setting.options?.join(", ") || ""}
                              onChange={(e) => {
                                const options = e.target.value
                                  .split(",")
                                  .map((opt) => opt.trim());
                                updateField(
                                  index,
                                  { ...setting, options },
                                  true
                                );
                              }}
                              placeholder="option1, option2, option3"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ADVANCED TAB */}
              <TabsContent value="advanced" className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="activeStatus">Statut</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="activeStatus"
                        checked={currentComponent?.isActive || false}
                        onCheckedChange={(checked) =>
                          setCurrentComponent({
                            ...currentComponent!,
                            isActive: checked,
                          })
                        }
                      />
                      <Label htmlFor="activeStatus">
                        {currentComponent?.isActive ? "Actif" : "Inactif"}
                      </Label>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="content-json">
                      <AccordionTrigger>
                        <span className="flex items-center">
                          <Code className="mr-2 h-4 w-4" />
                          Structure JSON du contenu
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          className="font-mono text-xs h-60"
                          value={JSON.stringify(formValues.content, null, 2)}
                          onChange={(e) => {
                            try {
                              setFormValues({
                                ...formValues,
                                content: JSON.parse(e.target.value),
                              });
                            } catch (error) {
                              // Don't update if JSON is invalid
                            }
                          }}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          Modifiez directement la structure JSON du contenu.
                          Attention : JSON invalide ne sera pas sauvegardé.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="settings-json">
                      <AccordionTrigger>
                        <span className="flex items-center">
                          <Code className="mr-2 h-4 w-4" />
                          Structure JSON des paramètres
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          className="font-mono text-xs h-60"
                          value={JSON.stringify(formValues.settings, null, 2)}
                          onChange={(e) => {
                            try {
                              setFormValues({
                                ...formValues,
                                settings: JSON.parse(e.target.value),
                              });
                            } catch (error) {
                              // Don't update if JSON is invalid
                            }
                          }}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          Modifiez directement la structure JSON des paramètres.
                          Attention : JSON invalide ne sera pas sauvegardé.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsComponentDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleComponentSave}>
              {isNewComponent ? "Créer" : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le composant</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce composant ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteComponentId(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ComponentManager;
