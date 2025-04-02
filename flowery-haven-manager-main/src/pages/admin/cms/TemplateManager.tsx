// src/pages/admin/cms/TemplateManager.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
  Eye,
  Copy,
  PanelLeft,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Layout,
  LayoutTemplate,
  Columns,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cmsService, CMSTemplate } from "@/services/cms.service";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from "react-beautiful-dnd";

const TemplateManager = () => {
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState<CMSTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CMSTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<CMSTemplate> | null>(null);
  const [isNewTemplate, setIsNewTemplate] = useState(true);
  
  // Preview dialog
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CMSTemplate | null>(null);
  
  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  
  // Template sections management
  const [templateSections, setTemplateSections] = useState<Array<{
    name: string;
    type: 'section' | 'component';
    allowedComponents?: string[];
  }>>([]);
  
  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);
  
  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const allTemplates = await cmsService.getAllTemplates(false);
      setTemplates(allTemplates);
      
      // Apply initial filters
      applyFilters(allTemplates, searchQuery);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Erreur lors du chargement des modèles");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply filters
  const applyFilters = (
    allTemplates: CMSTemplate[],
    query: string
  ) => {
    let filtered = [...allTemplates];
    
    // Apply search filter
    if (query) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query.toLowerCase()) ||
          (template.description && template.description.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    setFilteredTemplates(filtered);
  };
  
  // Update filters when they change
  useEffect(() => {
    applyFilters(templates, searchQuery);
  }, [templates, searchQuery]);
  
  // Handle filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  // Template management
  const openAddTemplateDialog = () => {
    setCurrentTemplate({
      name: "",
      description: "",
      structure: [],
      isActive: true
    });
    setTemplateSections([]);
    setIsNewTemplate(true);
    setIsTemplateDialogOpen(true);
  };
  
  const openEditTemplateDialog = (template: CMSTemplate) => {
    setCurrentTemplate(template);
    setTemplateSections([...template.structure]);
    setIsNewTemplate(false);
    setIsTemplateDialogOpen(true);
  };
  
  const handleTemplateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        name: e.target.value
      });
    }
  };
  
  const handleTemplateDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        description: e.target.value
      });
    }
  };
  
  const handleActiveChange = (checked: boolean) => {
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        isActive: checked
      });
    }
  };
  
  const addSection = () => {
    setTemplateSections([
      ...templateSections,
      { 
        name: `Section ${templateSections.length + 1}`, 
        type: 'section'
      }
    ]);
  };
  
  const addComponentArea = () => {
    setTemplateSections([
      ...templateSections,
      { 
        name: `Zone de composant ${templateSections.length + 1}`, 
        type: 'component',
        allowedComponents: []
      }
    ]);
  };
  
  const updateSectionName = (index: number, name: string) => {
    const newSections = [...templateSections];
    newSections[index].name = name;
    setTemplateSections(newSections);
  };
  
  const updateSectionType = (index: number, type: 'section' | 'component') => {
    const newSections = [...templateSections];
    newSections[index].type = type;
    setTemplateSections(newSections);
  };
  
  const removeSection = (index: number) => {
    const newSections = [...templateSections];
    newSections.splice(index, 1);
    setTemplateSections(newSections);
  };
  
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(templateSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setTemplateSections(items);
  };
  
  const saveTemplate = async () => {
    if (!currentTemplate || !currentTemplate.name) {
      toast.error("Le nom du modèle est obligatoire");
      return;
    }
    
    if (templateSections.length === 0) {
      toast.error("Le modèle doit contenir au moins une section");
      return;
    }
    
    try {
      if (isNewTemplate) {
        // Create new template
        const newTemplate = await cmsService.createTemplate(
          currentTemplate.name,
          templateSections,
          currentTemplate.description
        );
        
        setTemplates([...templates, newTemplate]);
        toast.success("Modèle créé avec succès");
      } else {
        // Update existing template
        const updatedTemplate = await cmsService.updateTemplate(
          currentTemplate.id!,
          {
            name: currentTemplate.name,
            description: currentTemplate.description,
            structure: templateSections,
            isActive: currentTemplate.isActive
          }
        );
        
        setTemplates(
          templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
        );
        toast.success("Modèle mis à jour avec succès");
      }
      
      setIsTemplateDialogOpen(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erreur lors de l'enregistrement du modèle");
    }
  };
  
  const toggleTemplateActive = async (template: CMSTemplate) => {
    try {
      const updatedTemplate = await cmsService.updateTemplate(
        template.id,
        { isActive: !template.isActive }
      );
      
      setTemplates(
        templates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
      );
      
      toast.success(
        updatedTemplate.isActive
          ? "Modèle activé avec succès"
          : "Modèle désactivé avec succès"
      );
    } catch (error) {
      console.error("Error toggling template state:", error);
      toast.error("Erreur lors de la modification de l'état du modèle");
    }
  };
  
  // Delete template
  const openDeleteDialog = (templateId: string) => {
    setDeleteTemplateId(templateId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deleteTemplateId) return;
    
    try {
      await cmsService.deleteTemplate(deleteTemplateId);
      
      setTemplates(templates.filter((t) => t.id !== deleteTemplateId));
      setFilteredTemplates(filteredTemplates.filter((t) => t.id !== deleteTemplateId));
      
      toast.success("Modèle supprimé avec succès");
      setIsDeleteDialogOpen(false);
      setDeleteTemplateId(null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Erreur : ${error.message}`);
      } else {
        toast.error("Erreur lors de la suppression du modèle");
      }
      console.error("Error deleting template:", error);
    }
  };
  
  // Duplicate template
  const duplicateTemplate = async (template: CMSTemplate) => {
    try {
      // Create a new template based on the original
      const newTemplate = await cmsService.createTemplate(
        `Copie de ${template.name}`,
        template.structure,
        template.description
      );
      
      setTemplates([...templates, newTemplate]);
      toast.success("Modèle dupliqué avec succès");
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Erreur lors de la duplication du modèle");
    }
  };
  
  // Preview template
  const openPreviewDialog = (template: CMSTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
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
            <h1 className="text-3xl font-bold tracking-tight">Modèles de page</h1>
            <p className="text-muted-foreground">
              Créez et gérez les modèles pour structurer vos pages.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddTemplateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau modèle
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un modèle..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <LayoutTemplate className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">Aucun modèle trouvé</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery
                  ? "Essayez de modifier vos critères de recherche"
                  : "Commencez par créer votre premier modèle"}
              </p>
              <Button
                className="mt-4"
                onClick={searchQuery ? () => setSearchQuery("") : openAddTemplateDialog}
              >
                {searchQuery ? (
                  <>Réinitialiser la recherche</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un modèle
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
                    <TableHead>Description</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date de modification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {template.description || "Aucune description"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.structure.length} section(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.isActive ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(template.updatedAt.toString())}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditTemplateDialog(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPreviewDialog(template)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Aperçu
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateTemplate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleTemplateActive(template)}>
                              {template.isActive ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => openDeleteDialog(template.id)}
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

      {/* Template Dialog */}
      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewTemplate ? "Créer un modèle" : "Modifier le modèle"}
            </DialogTitle>
            <DialogDescription>
              {isNewTemplate
                ? "Créez un nouveau modèle pour structurer vos pages."
                : "Modifiez la structure du modèle sélectionné."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Nom</Label>
                <Input
                  id="templateName"
                  value={currentTemplate?.name || ""}
                  onChange={handleTemplateNameChange}
                  placeholder="Nom du modèle"
                />
              </div>
              <div className="flex items-center space-x-2 mt-8">
                <Switch
                  id="isActive"
                  checked={currentTemplate?.isActive || false}
                  onCheckedChange={handleActiveChange}
                />
                <Label htmlFor="isActive">Actif</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={currentTemplate?.description || ""}
                onChange={handleTemplateDescriptionChange}
                placeholder="Description du modèle"
                rows={2}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Structure du modèle</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addSection}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter une section
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addComponentArea}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter une zone de composant
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                {templateSections.length === 0 ? (
                  <div className="text-center py-12">
                    <PanelLeft className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">Aucune section définie</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Commencez par ajouter des sections et zones de composants.
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button
                        variant="outline"
                        onClick={addSection}
                      >
                        <Layout className="h-4 w-4 mr-2" />
                        Ajouter une section
                      </Button>
                      <Button
                        variant="outline"
                        onClick={addComponentArea}
                      >
                        <Columns className="h-4 w-4 mr-2" />
                        Ajouter une zone de composant
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="template-sections">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {templateSections.map((section, index) => (
                            <Draggable
                              key={`section-${index}`}
                              draggableId={`section-${index}`}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="border rounded-md p-4 bg-muted/20"
                                >
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                      <Input
                                        value={section.name}
                                        onChange={(e) => updateSectionName(index, e.target.value)}
                                        placeholder="Nom de la section"
                                      />
                                    </div>
                                    <Select
                                      value={section.type}
                                      onValueChange={(value) => updateSectionType(index, value as 'section' | 'component')}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="section">Section</SelectItem>
                                        <SelectItem value="component">Zone de composant</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="flex justify-end mt-2">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removeSection(index)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      Supprimer
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={saveTemplate}>
              {isNewTemplate ? "Créer" : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
      >
        <DialogContent className="sm:max-w-[80%] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu du modèle: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Visualisation de la structure du modèle
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 border rounded-md">
            {previewTemplate && (
              <div className="p-6 space-y-6">
                {previewTemplate.structure.map((section, index) => (
                  <div 
                    key={`preview-${index}`}
                    className={`border-2 rounded-md p-4 ${
                      section.type === 'section' 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-purple-300 bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={
                        section.type === 'section'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-purple-100 text-purple-800 border-purple-200'
                      }>
                        {section.type === 'section' ? (
                          <Layout className="h-3 w-3 mr-1" />
                        ) : (
                          <Columns className="h-3 w-3 mr-1" />
                        )}
                        {section.type === 'section' ? 'Section' : 'Zone de composant'}
                      </Badge>
                      <span className="text-sm font-medium">{section.name}</span>
                    </div>
                    
                    {section.type === 'section' ? (
                      <div className="h-20 bg-white border border-dashed border-blue-300 rounded flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">Contenu de la section</span>
                      </div>
                    ) : (
                      <div className="h-16 bg-white border border-dashed border-purple-300 rounded flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">Zone d'insertion de composant</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPreviewDialogOpen(false)}
            >
              Fermer
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
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer le modèle
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.
              <br /><br />
              <strong className="text-destructive">Attention :</strong> Si des pages utilisent ce modèle, vous ne pourrez pas le supprimer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTemplateId(null)}>
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

export default TemplateManager;