// src/pages/admin/cms/SpecialPages.tsx
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
  ArrowLeft,
  Calendar,
  Timer,
  Link,
  Copy,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { cmsService, PageContent } from "@/services/cms.service";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the extended page content with start and end dates
interface SpecialPage extends PageContent {
  startDate?: Date;
  endDate?: Date;
  priority?: number;
  targetUrl?: string;
  category?: string;
}

const SpecialPages = () => {
  const navigate = useNavigate();
  
  const [pages, setPages] = useState<SpecialPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<SpecialPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "upcoming" | "expired">("all");
  
  // Dialog states
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Partial<SpecialPage> | null>(null);
  const [isNewPage, setIsNewPage] = useState(true);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  
  // Categories for special pages
  const specialPageCategories = [
    "promotion",
    "event",
    "holiday",
    "announcement",
    "sale",
    "launch",
    "maintenance",
    "other"
  ];
  
  useEffect(() => {
    loadPages();
  }, []);
  
  const loadPages = async () => {
    setIsLoading(true);
    try {
      // Load all pages
      const allPages = await cmsService.getAllPages(true);
      
      // Filter and process special pages (component type can be used for special pages)
      const specialPages = allPages
        .filter(page => page.type === "component" && page.slug.startsWith("special-"))
        .map(page => {
          // Convert custom metadata fields from the content
          const content = page.content || "";
          let startDate: Date | undefined;
          let endDate: Date | undefined;
          let priority: number | undefined;
          let targetUrl: string | undefined;
          let category: string | undefined;
          
          // Try to extract metadata from content (assuming it contains HTML comments with JSON)
          try {
            const metadataMatch = content.match(/<!--\s*metadata\s*({[^}]+})\s*-->/);
            if (metadataMatch && metadataMatch[1]) {
              const metadata = JSON.parse(metadataMatch[1]);
              if (metadata.startDate) startDate = new Date(metadata.startDate);
              if (metadata.endDate) endDate = new Date(metadata.endDate);
              if (metadata.priority) priority = metadata.priority;
              if (metadata.targetUrl) targetUrl = metadata.targetUrl;
              if (metadata.category) category = metadata.category;
            }
          } catch (err) {
            console.warn("Error parsing metadata for page", page.id, err);
          }
          
          return {
            ...page,
            startDate,
            endDate,
            priority,
            targetUrl,
            category
          };
        });
      
      setPages(specialPages);
      
      // Apply initial filters
      applyFilters(specialPages, searchQuery, statusFilter);
    } catch (error) {
      console.error("Error loading special pages:", error);
      toast.error("Erreur lors du chargement des pages spéciales");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply filters
  const applyFilters = (
    allPages: SpecialPage[],
    query: string,
    status: string
  ) => {
    let filtered = [...allPages];
    const now = new Date();
    
    // Apply search filter
    if (query) {
      filtered = filtered.filter(
        (page) =>
          page.title.toLowerCase().includes(query.toLowerCase()) ||
          page.slug.toLowerCase().includes(query.toLowerCase()) ||
          page.category?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Apply status filter
    if (status !== "all") {
      switch (status) {
        case "active":
          filtered = filtered.filter(page => 
            page.published && 
            (!page.startDate || isBefore(page.startDate, now)) &&
            (!page.endDate || isAfter(page.endDate, now))
          );
          break;
        case "upcoming":
          filtered = filtered.filter(page => 
            page.startDate && isAfter(page.startDate, now)
          );
          break;
        case "expired":
          filtered = filtered.filter(page => 
            page.endDate && isBefore(page.endDate, now)
          );
          break;
      }
    }
    
    // Sort by start date (upcoming first), then by priority (higher first)
    filtered.sort((a, b) => {
      // First sort by active status
      const aActive = isPageActive(a);
      const bActive = isPageActive(b);
      
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // Then sort by start date (for upcoming)
      if (a.startDate && b.startDate) {
        return a.startDate.getTime() - b.startDate.getTime();
      }
      
      // Finally sort by priority
      return (b.priority || 0) - (a.priority || 0);
    });
    
    setFilteredPages(filtered);
  };
  
  // Update filters when they change
  useEffect(() => {
    applyFilters(pages, searchQuery, statusFilter);
  }, [pages, searchQuery, statusFilter]);
  
  // Handle filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as "all" | "active" | "upcoming" | "expired");
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };
  
  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "—";
    
    try {
      return format(new Date(date), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return String(date);
    }
  };
  
  // Check if a page is currently active
  const isPageActive = (page: SpecialPage): boolean => {
    const now = new Date();
    const isPublished = page.published;
    const isAfterStart = !page.startDate || isBefore(page.startDate, now);
    const isBeforeEnd = !page.endDate || isAfter(page.endDate, now);
    
    return isPublished && isAfterStart && isBeforeEnd;
  };
  
  // Add/Edit page handlers
  const openAddPageDialog = () => {
    // Generate a default slug with timestamp to ensure uniqueness
    const timestamp = Date.now();
    
    setCurrentPage({
      title: "",
      slug: `special-${timestamp}`,
      content: "<!-- metadata {} -->",
      metaTitle: "",
      metaDescription: "",
      published: false,
      type: "component",
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      priority: 10,
      category: "promotion"
    });
    
    setIsNewPage(true);
    setIsPageDialogOpen(true);
  };
  
  const openEditPageDialog = (page: SpecialPage) => {
    setCurrentPage(page);
    setIsNewPage(false);
    setIsPageDialogOpen(true);
  };
  
  const handlePageSave = async () => {
    if (!currentPage || !currentPage.title || !currentPage.slug) {
      toast.error("Titre et slug sont obligatoires");
      return;
    }
    
    try {
      // Prepare metadata to embed in the content
      const metadata = {
        startDate: currentPage.startDate,
        endDate: currentPage.endDate,
        priority: currentPage.priority,
        targetUrl: currentPage.targetUrl,
        category: currentPage.category
      };
      
      // Ensure the content has our metadata
      let content = currentPage.content || "";
      
      // Replace or add metadata comment
      if (content.includes("<!-- metadata")) {
        content = content.replace(/<!--\s*metadata\s*({[^}]+})\s*-->/, `<!-- metadata ${JSON.stringify(metadata)} -->`);
      } else {
        content = `<!-- metadata ${JSON.stringify(metadata)} -->\n${content}`;
      }
      
      if (isNewPage) {
        // Create new page
        const newPage = await cmsService.createPage(
          currentPage.title,
          currentPage.slug,
          content,
          {
            metaTitle: currentPage.metaTitle,
            metaDescription: currentPage.metaDescription,
            published: currentPage.published,
            type: "component" as PageContent["type"]
          }
        );
        
        // Add our custom properties
        const specialPage: SpecialPage = {
          ...newPage,
          startDate: currentPage.startDate,
          endDate: currentPage.endDate,
          priority: currentPage.priority,
          targetUrl: currentPage.targetUrl,
          category: currentPage.category
        };
        
        setPages([...pages, specialPage]);
        toast.success("Page spéciale créée avec succès");
      } else {
        // Update existing page
        const updatedPage = await cmsService.updatePage(currentPage.id!, {
          title: currentPage.title,
          slug: currentPage.slug,
          content: content,
          metaTitle: currentPage.metaTitle,
          metaDescription: currentPage.metaDescription,
          published: currentPage.published
        });
        
        // Add our custom properties
        const specialPage: SpecialPage = {
          ...updatedPage,
          startDate: currentPage.startDate,
          endDate: currentPage.endDate,
          priority: currentPage.priority,
          targetUrl: currentPage.targetUrl,
          category: currentPage.category
        };
        
        setPages(
          pages.map((p) => (p.id === specialPage.id ? specialPage : p))
        );
        toast.success("Page spéciale mise à jour avec succès");
      }
      
      setIsPageDialogOpen(false);
    } catch (error) {
      console.error("Error saving special page:", error);
      toast.error("Erreur lors de l'enregistrement de la page spéciale");
    }
  };
  
  // Delete page handlers
  const openDeleteDialog = (pageId: string) => {
    setDeletePageId(pageId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deletePageId) return;
    
    try {
      await cmsService.deletePage(deletePageId);
      
      setPages(pages.filter((p) => p.id !== deletePageId));
      setFilteredPages(filteredPages.filter((p) => p.id !== deletePageId));
      
      toast.success("Page spéciale supprimée avec succès");
      setIsDeleteDialogOpen(false);
      setDeletePageId(null);
    } catch (error) {
      console.error("Error deleting special page:", error);
      toast.error("Erreur lors de la suppression de la page spéciale");
    }
  };
  
  // Toggle page published state
  const togglePagePublished = async (page: SpecialPage) => {
    try {
      const updatedPage = await cmsService.togglePagePublished(page.id, !page.published);
      
      // Create special page with the original metadata
      const specialPage: SpecialPage = {
        ...updatedPage,
        startDate: page.startDate,
        endDate: page.endDate,
        priority: page.priority,
        targetUrl: page.targetUrl,
        category: page.category
      };
      
      setPages(
        pages.map((p) => (p.id === specialPage.id ? specialPage : p))
      );
      
      toast.success(
        specialPage.published
          ? "Page spéciale publiée avec succès"
          : "Page spéciale dépubliée avec succès"
      );
    } catch (error) {
      console.error("Error toggling page state:", error);
      toast.error("Erreur lors du changement d'état de la page");
    }
  };
  
  // Duplicate a special page
  const duplicatePage = async (page: SpecialPage) => {
    try {
      // Create a slug with timestamp to ensure uniqueness
      const timestamp = Date.now();
      const newSlug = `${page.slug}-copy-${timestamp}`;
      
      // Prepare metadata
      const metadata = {
        startDate: page.startDate,
        endDate: page.endDate,
        priority: page.priority,
        targetUrl: page.targetUrl,
        category: page.category
      };
      
      // Prepare content with metadata
      let content = page.content || "";
      if (content.includes("<!-- metadata")) {
        content = content.replace(/<!--\s*metadata\s*({[^}]+})\s*-->/, `<!-- metadata ${JSON.stringify(metadata)} -->`);
      } else {
        content = `<!-- metadata ${JSON.stringify(metadata)} -->\n${content}`;
      }
      
      // Create the duplicate page
      const newPage = await cmsService.createPage(
        `Copie de ${page.title}`,
        newSlug,
        content,
        {
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          published: false, // Always start as draft
          type: "component" as PageContent["type"]
        }
      );
      
      // Add our custom properties
      const specialPage: SpecialPage = {
        ...newPage,
        startDate: page.startDate,
        endDate: page.endDate,
        priority: page.priority,
        targetUrl: page.targetUrl,
        category: page.category
      };
      
      setPages([...pages, specialPage]);
      toast.success("Page spéciale dupliquée avec succès");
      
      // Open the new page for editing
      openEditPageDialog(specialPage);
    } catch (error) {
      console.error("Error duplicating special page:", error);
      toast.error("Erreur lors de la duplication de la page spéciale");
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
            <h1 className="text-3xl font-bold tracking-tight">Pages spéciales</h1>
            <p className="text-muted-foreground">
              Créez et gérez des pages temporaires pour les promotions, événements et annonces.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddPageDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle page spéciale
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" onClick={() => handleStatusFilterChange("all")}>
                Toutes
              </TabsTrigger>
              <TabsTrigger value="active" onClick={() => handleStatusFilterChange("active")}>
                Actives
              </TabsTrigger>
              <TabsTrigger value="upcoming" onClick={() => handleStatusFilterChange("upcoming")}>
                À venir
              </TabsTrigger>
              <TabsTrigger value="expired" onClick={() => handleStatusFilterChange("expired")}>
                Expirées
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher une page spéciale..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">Aucune page spéciale trouvée</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Commencez par créer votre première page spéciale"}
              </p>
              <Button
                className="mt-4"
                onClick={searchQuery || statusFilter !== "all" ? resetFilters : openAddPageDialog}
              >
                {searchQuery || statusFilter !== "all" ? (
                  <>Réinitialiser les filtres</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une page spéciale
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => {
                    const isActive = isPageActive(page);
                    
                    return (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div className="font-medium">{page.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">/{page.slug}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {page.category || "other"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {page.startDate && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Du {formatDate(page.startDate)}</span>
                              </div>
                            )}
                            {page.endDate && (
                              <div className="flex items-center mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Au {formatDate(page.endDate)}</span>
                              </div>
                            )}
                            {!page.startDate && !page.endDate && <span>Pas de période définie</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : page.startDate && isAfter(page.startDate, new Date()) ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              <Timer className="w-3 h-3 mr-1" />
                              À venir
                            </Badge>
                          ) : page.endDate && isBefore(page.endDate, new Date()) ? (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Expirée
                            </Badge>
                          ) : !page.published ? (
                            <Badge variant="outline">
                              Brouillon
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            {page.priority || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/cms/${page.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicatePage(page)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              {page.targetUrl && (
                                <DropdownMenuItem onClick={() => window.open(page.targetUrl!, "_blank")}>
                                  <Link className="h-4 w-4 mr-2" />
                                  Voir la cible
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => window.open(`/${page.slug}`, "_blank")}>
                                <Eye className="h-4 w-4 mr-2" />
                                Aperçu
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => togglePagePublished(page)}>
                                {page.published ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Dépublier
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Publier
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => openDeleteDialog(page.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Special Page Dialog */}
      <Dialog
        open={isPageDialogOpen}
        onOpenChange={setIsPageDialogOpen}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {isNewPage ? "Créer une page spéciale" : "Modifier la page spéciale"}
            </DialogTitle>
            <DialogDescription>
              {isNewPage
                ? "Créez une page temporaire pour vos promotions, événements ou annonces."
                : "Modifiez les propriétés de la page spéciale sélectionnée."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={currentPage?.title || ""}
                  onChange={(e) => 
                    setCurrentPage({
                      ...currentPage!,
                      title: e.target.value,
                    })
                  }
                  placeholder="Titre de la page"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={currentPage?.slug || ""}
                  onChange={(e) => 
                    setCurrentPage({
                      ...currentPage!,
                      slug: e.target.value,
                    })
                  }
                  placeholder="url-de-la-page"
                />
                <p className="text-xs text-muted-foreground">
                  L'URL de la page. Les pages spéciales commencent par "special-".
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={currentPage?.category || "promotion"}
                  onValueChange={(value) =>
                    setCurrentPage({
                      ...currentPage!,
                      category: value,
                    })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {specialPageCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="100"
                  value={currentPage?.priority || 10}
                  onChange={(e) => 
                    setCurrentPage({
                      ...currentPage!,
                      priority: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Valeur de 1 à 100. Plus la valeur est élevée, plus la priorité est haute.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {currentPage?.startDate
                        ? format(currentPage.startDate, "dd MMMM yyyy", { locale: fr })
                        : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={currentPage?.startDate}
                      onSelect={(date) =>
                        setCurrentPage({
                          ...currentPage!,
                          startDate: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {currentPage?.endDate
                        ? format(currentPage.endDate, "dd MMMM yyyy", { locale: fr })
                        : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={currentPage?.endDate}
                      onSelect={(date) =>
                        setCurrentPage({
                          ...currentPage!,
                          endDate: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetUrl">URL de redirection (optionnel)</Label>
              <Input
                id="targetUrl"
                value={currentPage?.targetUrl || ""}
                onChange={(e) => 
                  setCurrentPage({
                    ...currentPage!,
                    targetUrl: e.target.value,
                  })
                }
                placeholder="https://example.com/promotion"
              />
              <p className="text-xs text-muted-foreground">
                Si renseignée, les visiteurs seront redirigés vers cette URL.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={currentPage?.content || ""}
                onChange={(e) => 
                  setCurrentPage({
                    ...currentPage!,
                    content: e.target.value,
                  })
                }
                rows={5}
                placeholder="Contenu HTML de la page"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={currentPage?.published || false}
                onCheckedChange={(checked) =>
                  setCurrentPage({
                    ...currentPage!,
                    published: checked,
                  })
                }
              />
              <Label htmlFor="published">Publier</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPageDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handlePageSave}>
              {isNewPage ? "Créer" : "Mettre à jour"}
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
            <AlertDialogTitle>Supprimer la page spéciale</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette page spéciale ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePageId(null)}>
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

export default SpecialPages;