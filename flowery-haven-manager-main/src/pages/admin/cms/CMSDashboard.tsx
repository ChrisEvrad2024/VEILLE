// src/pages/admin/cms/CMSDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Calendar,
  Home,
  Filter,
  Layout,
  FilePlus,
  FileText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CMSDashboard = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageContent[]>([]);
  const [filteredPages, setFilteredPages] = useState<PageContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "page" | "section" | "component"
  >("all");

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicatePageData, setDuplicatePageData] = useState<{
    originalId: string;
    title: string;
    slug: string;
  } | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setIsLoading(true);
    try {
      // Get all pages including unpublished (true parameter)
      const allPages = await cmsService.getAllPages(true);
      setPages(allPages);

      // Apply initial filters
      applyFilters(allPages, searchQuery, statusFilter, typeFilter);
    } catch (error) {
      console.error("Error loading pages:", error);
      toast.error("Erreur lors du chargement des pages");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply all filters and sorting
  const applyFilters = (
    allPages: PageContent[],
    query: string,
    status: string,
    type: string
  ) => {
    let filtered = [...allPages];

    // Apply search filter
    if (query) {
      filtered = filtered.filter(
        (page) =>
          page.title.toLowerCase().includes(query.toLowerCase()) ||
          page.slug.toLowerCase().includes(query.toLowerCase()) ||
          page.content.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply status filter
    if (status !== "all") {
      const isPublished = status === "published";
      filtered = filtered.filter((page) => page.published === isPublished);
    }

    // Apply type filter
    if (type !== "all") {
      filtered = filtered.filter((page) => page.type === type);
    }

    setFilteredPages(filtered);
  };

  // Update filters when any filter changes
  useEffect(() => {
    applyFilters(pages, searchQuery, statusFilter, typeFilter);
  }, [searchQuery, statusFilter, typeFilter, pages]);

  // Handle filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as "all" | "published" | "draft");
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value as "all" | "page" | "section" | "component");
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Handle delete page
  const handleDeleteClick = (pageId: string) => {
    setDeletePageId(pageId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletePageId === null) return;

    try {
      await cmsService.deletePage(deletePageId);
      setPages(pages.filter((page) => page.id !== deletePageId));
      setFilteredPages(
        filteredPages.filter((page) => page.id !== deletePageId)
      );
      toast.success("Page supprimée avec succès");
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error("Erreur lors de la suppression de la page");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletePageId(null);
    }
  };

  // Handle duplicate page
  const handleDuplicateClick = (page: PageContent) => {
    setDuplicatePageData({
      originalId: page.id,
      title: `Copie de ${page.title}`,
      slug: `${page.slug}-copy`,
    });
    setIsDuplicateDialogOpen(true);
  };

  const confirmDuplicate = async () => {
    if (!duplicatePageData) return;

    try {
      const originalPage = pages.find(
        (p) => p.id === duplicatePageData.originalId
      );

      if (!originalPage) {
        throw new Error("Page originale non trouvée");
      }

      const newPage = await cmsService.createPage(
        duplicatePageData.title,
        duplicatePageData.slug,
        originalPage.content,
        {
          metaTitle: originalPage.metaTitle,
          metaDescription: originalPage.metaDescription,
          published: false, // Always create as draft
          template: originalPage.template,
          type: originalPage.type,
        }
      );

      setPages([...pages, newPage]);
      toast.success("Page dupliquée avec succès");

      // Navigate to edit the new page
      navigate(`/admin/cms/${newPage.id}/edit`);
    } catch (error) {
      console.error("Error duplicating page:", error);
      toast.error("Erreur lors de la duplication de la page");
    } finally {
      setIsDuplicateDialogOpen(false);
      setDuplicatePageData(null);
    }
  };

  // Handle edit page
  const handleEditPage = (pageId: string) => {
    navigate(`/admin/cms/${pageId}/edit`);
  };

  // Handle add new page - Correction ici pour assurer que la page de création s'ouvre
  const handleAddPage = () => {
    // Redirection directe vers la route de création
    navigate("/admin/cms/new");
  };

  // Handle view page
  const handleViewPage = (slug: string) => {
    window.open(`/${slug === "home" ? "" : slug}`, "_blank");
  };

  // Toggle page published status
  const togglePagePublished = async (page: PageContent) => {
    try {
      const updatedPage = await cmsService.togglePagePublished(
        page.id,
        !page.published
      );

      setPages(pages.map((p) => (p.id === updatedPage.id ? updatedPage : p)));

      toast.success(
        updatedPage.published
          ? "Page publiée avec succès"
          : "Page dépubliée avec succès"
      );
    } catch (error) {
      console.error("Error toggling page status:", error);
      toast.error("Erreur lors du changement du statut de la page");
    }
  };

  // Get badge for page type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "page":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            <FileText className="w-3 h-3 mr-1" />
            Page
          </Badge>
        );
      case "section":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            <Layout className="w-3 h-3 mr-1" />
            Section
          </Badge>
        );
      case "component":
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 border-purple-200"
          >
            <FilePlus className="w-3 h-3 mr-1" />
            Composant
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get badge for page status
  const getStatusBadge = (
    published: boolean,
    isHomepage: boolean | undefined
  ) => {
    if (isHomepage) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          <Home className="w-3 h-3 mr-1" />
          Page d'accueil
        </Badge>
      );
    }

    return published ? (
      <Badge
        variant="outline"
        className="bg-green-100 text-green-800 border-green-200"
      >
        <Eye className="w-3 h-3 mr-1" />
        Publié
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-gray-100 text-gray-800 border-gray-200"
      >
        Brouillon
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion du contenu
          </h1>
          <p className="text-muted-foreground">
            Créez, modifiez et organisez le contenu de votre site.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddPage}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle page
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/cms/components")}
          >
            <Layout className="h-4 w-4 mr-2" />
            Composants
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="all"
                onClick={() => handleStatusChange("all")}
              >
                Toutes
              </TabsTrigger>
              <TabsTrigger
                value="published"
                onClick={() => handleStatusChange("published")}
              >
                Publiées
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                onClick={() => handleStatusChange("draft")}
              >
                Brouillons
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher une page..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={handleTypeChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="page">Pages</SelectItem>
                    <SelectItem value="section">Sections</SelectItem>
                    <SelectItem value="component">Composants</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetFilters}
                  title="Réinitialiser les filtres"
                >
                  <Filter className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadPages}
                  title="Actualiser"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
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
              <h3 className="mt-4 text-lg font-medium">Aucune page trouvée</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Commencez par créer votre première page"}
              </p>
              <Button
                className="mt-4"
                onClick={
                  searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? resetFilters
                    : handleAddPage
                }
              >
                {searchQuery ||
                statusFilter !== "all" ||
                typeFilter !== "all" ? (
                  <>Réinitialiser les filtres</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une page
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Titre</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière mise à jour</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        {page.title}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        /{page.slug === "home" ? "" : page.slug}
                      </TableCell>
                      <TableCell>{getTypeBadge(page.type)}</TableCell>
                      <TableCell>
                        {getStatusBadge(page.published, page.isHomepage)}
                      </TableCell>
                      <TableCell>
                        {formatDate(page.updatedAt.toString())}
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
                              onClick={() => handleViewPage(page.slug)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(`/admin/cms/${page.id}/visual-editor`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Éditeur visuel
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditPage(page.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateClick(page)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => togglePagePublished(page)}
                            >
                              {page.published ? (
                                <>
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Repasser en brouillon
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Publier
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(page.id)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Êtes-vous sûr de vouloir supprimer ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La page sera définitivement
              supprimée.
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

      {/* Duplicate Dialog */}
      <Dialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Dupliquer la page</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="title">
                Titre
              </label>
              <Input
                id="title"
                value={duplicatePageData?.title || ""}
                onChange={(e) =>
                  setDuplicatePageData((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="slug">
                Slug
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="slug"
                  value={duplicatePageData?.slug || ""}
                  onChange={(e) =>
                    setDuplicatePageData((prev) =>
                      prev ? { ...prev, slug: e.target.value } : null
                    )
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                L'identifiant unique qui formera l'URL de la page.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDuplicateDialogOpen(false);
                setDuplicatePageData(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDuplicate}
              disabled={!duplicatePageData?.title || !duplicatePageData?.slug}
            >
              Dupliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMSDashboard;