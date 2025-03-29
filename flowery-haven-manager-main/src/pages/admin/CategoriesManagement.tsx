import { useState, useEffect } from "react";
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
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/components/admin/CategoryForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Category } from "@/types/category";
import { productService } from "@/services/product.service";



const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load categories
    loadCategories();
  }, []);

  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const allCategories = await productService.getAllCategories();
      setCategories(allCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadProductCounts = async () => {
      const counts: Record<string, number> = {};
      
      for (const category of categories) {
        try {
          const products = await productService.getProductsByCategory(category.id);
          counts[category.id] = products.length;
        } catch (error) {
          console.error(`Error counting products for category ${category.id}:`, error);
          counts[category.id] = 0;
        }
      }
      
      setProductCounts(counts);
    };
    
    if (categories.length > 0) {
      loadProductCounts();
    }
  }, [categories]);

  // Filter categories based on search query
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.id &&
        category.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get product count for a category
  const getProductCount = async (categoryId: string) => {
    try {
      const products = await productService.getProductsByCategory(categoryId);
      return products.length;
    } catch (error) {
      console.error(
        `Error counting products for category ${categoryId}:`,
        error
      );
      return 0;
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (categoryId: string) => {
    // Check if any products use this category before deletion
    const productCount = getProductCount(categoryId);

    if (productCount > 0) {
      toast.error(`Impossible de supprimer cette catégorie`, {
        description: `${productCount} produit(s) sont associés à cette catégorie. Veuillez d'abord les réassigner.`,
        duration: 5000,
      });
      return;
    }

    setCategoryToDelete(categoryId);
    setIsDeleteDialogOpen(true);
  };

  // Confirm category deletion
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const success = await productService.deleteCategory(categoryToDelete);

      if (success) {
        setCategories(
          categories.filter((category) => category.id !== categoryToDelete)
        );

        toast.success("Catégorie supprimée", {
          description: "La catégorie a été supprimée avec succès.",
        });
      } else {
        throw new Error("Failed to delete category");
      }
    } catch (error) {
      console.error(`Error deleting category ${categoryToDelete}:`, error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setCategoryToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle edit category
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  // Handle adding new category
  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  // Handle save category
  const handleSaveCategory = async (category: Category) => {
    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategory = await productService.updateCategory(category);
        setCategories(
          categories.map((c) => (c.id === category.id ? updatedCategory : c))
        );

        toast.success("Catégorie mise à jour", {
          description: "La catégorie a été mise à jour avec succès.",
        });
      } else {
        // Check if ID already exists
        if (categories.some((c) => c.id === category.id)) {
          toast.error("ID de catégorie déjà utilisé", {
            description: "Veuillez choisir un identifiant unique.",
          });
          return;
        }

        // Add new category
        const newCategory = await productService.addCategory(category);
        setCategories([...categories, newCategory]);

        toast.success("Catégorie ajoutée", {
          description: "La catégorie a été ajoutée avec succès.",
        });
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catégories</h1>
          <p className="text-muted-foreground">
            Gérez les catégories de produits.
          </p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une catégorie
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher une catégorie..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-center">
                      Nombre de produits
                    </TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => {
                      const productCount = productCounts[category.id] || 0;

                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              {category.image ? (
                                <div className="w-10 h-10 rounded-md overflow-hidden bg-muted">
                                  <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Si l'image ne charge pas, on met une image par défaut
                                      (e.target as HTMLImageElement).src =
                                        "/placeholder.svg";
                                    }}
                                  />
                                </div>
                              ) : null}
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {category.description}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {category.id}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                productCount > 0
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {productCount}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(
                                      `/catalog?category=${category.id}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir les produits
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    handleDeleteCategory(category.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Aucune catégorie trouvée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {filteredCategories.length} sur {categories.length}{" "}
            catégories
          </div>
        </CardFooter>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? "Modifier une catégorie"
                : "Ajouter une catégorie"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onSubmit={handleSaveCategory}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
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

export default CategoriesManagement;
