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
  Filter,
  X,
  ChevronDown,
  ExternalLink,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "@/components/admin/ProductForm";
import { Product } from "@/types/product";
import { productService } from "@/services/product.service";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Category } from "@/types/category";
import { Separator } from "@/components/ui/separator";

// Type of view for products
type ViewMode = "grid" | "table";

const ProductsManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in-stock" | "out-of-stock"
  >("all");
  const [featuredFilter, setFeaturedFilter] = useState<boolean | undefined>(
    undefined
  );
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "newest">(
    "newest"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load products and categories
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allProducts = await productService.getAllProducts();
      const allCategories = await productService.getAllCategories();
  
      setProducts(allProducts);
      setCategories(allCategories);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };
  

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Apply filters to products
  const getFilteredProducts = () => {
    return products
      .filter((product) => {
        // Search filter
        const matchesSearch =
          searchQuery === "" ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (product.sku &&
            product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

        // Category filter
        const matchesCategory =
          selectedCategory === "" || product.category === selectedCategory;

        // Stock filter
        let matchesStock = true;
        if (stockFilter === "in-stock") {
          matchesStock = product.stock === undefined || product.stock > 0;
        } else if (stockFilter === "out-of-stock") {
          matchesStock = product.stock !== undefined && product.stock <= 0;
        }

        // Featured filter
        const matchesFeatured =
          featuredFilter === undefined || product.featured === featuredFilter;

        return (
          matchesSearch && matchesCategory && matchesStock && matchesFeatured
        );
      })
      .sort((a, b) => {
        // Sort products
        switch (sortBy) {
          case "name":
            return sortDirection === "asc"
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          case "price":
            return sortDirection === "asc"
              ? a.price - b.price
              : b.price - a.price;
          case "stock":
            const stockA = a.stock ?? Infinity;
            const stockB = b.stock ?? Infinity;
            return sortDirection === "asc" ? stockA - stockB : stockB - stockA;
          case "newest":
            // Assuming ID contains timestamp (e.g., prod-{timestamp})
            const idA = a.id.split("-")[1] ?? "0";
            const idB = b.id.split("-")[1] ?? "0";
            return sortDirection === "asc"
              ? idA.localeCompare(idB)
              : idB.localeCompare(idA);
          default:
            return 0;
        }
      });
  };

  const filteredProducts = getFilteredProducts();

  // Handle product deletion
  const handleDeleteClick = (productId: string) => {
    setDeleteProductId(productId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteProductId) return;
  
    try {
      const success = await productService.deleteProduct(deleteProductId);
  
      if (success) {
        // Update local state
        setProducts(products.filter((p) => p.id !== deleteProductId));
  
        toast.success("Produit supprimé", {
          description: "Le produit a été supprimé avec succès.",
        });
      } else {
        throw new Error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Erreur lors de la suppression du produit");
    } finally {
      setDeleteProductId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  // Handle view product details
  const handleViewProduct = (product: Product) => {
    setDetailProduct(product);
    setIsDetailDialogOpen(true);
  };

  // Handle adding new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  // Handle save product
  const handleSaveProduct = async (product: Product) => {
    try {
      if (editingProduct) {
        // Update existing product
        const updatedProduct = await productService.updateProduct(product);
        setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
  
        toast.success("Produit mis à jour", {
          description: "Le produit a été mis à jour avec succès.",
        });
      } else {
        // Add new product
        const newProduct = await productService.addProduct(product);
        setProducts([...products, newProduct]);
  
        toast.success("Produit ajouté", {
          description: "Le produit a été ajouté avec succès.",
        });
      }
  
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Erreur lors de l'enregistrement du produit");
    }
  };

  // Handle duplicate product
  const handleDuplicateProduct = async (product: Product) => {
    try {
      // Créer un nouvel objet sans id pour laisser le service générer un nouvel id
      const duplicateProduct = {
        ...product,
        id: undefined as any, // nous forçons undefined car le service générera un id
        name: `${product.name} (copie)`,
        sku: product.sku ? `${product.sku}-copy` : undefined,
      };
      
      const newProduct = await productService.addProduct(duplicateProduct);
      setProducts([...products, newProduct]);
  
      toast.success("Produit dupliqué", {
        description: "Une copie du produit a été créée.",
      });
    } catch (error) {
      console.error("Error duplicating product:", error);
      toast.error("Erreur lors de la duplication du produit");
    }
  };

  // Toggle sort direction
  const toggleSort = (sortKey: "name" | "price" | "stock" | "newest") => {
    if (sortBy === sortKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(sortKey);
      setSortDirection("asc");
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setStockFilter("all");
    setFeaturedFilter(undefined);
    setSortBy("newest");
    setSortDirection("desc");
  };

  // Get stock status label and class
  const getStockStatus = (stock?: number) => {
    if (stock === undefined) {
      return {
        label: "En stock",
        class: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      };
    } else if (stock <= 0) {
      return {
        label: "Rupture",
        class: "bg-red-100 text-red-800 border-red-300",
        icon: <XCircle className="h-3 w-3 mr-1" />,
      };
    } else if (stock < 5) {
      return {
        label: "Stock faible",
        class: "bg-amber-100 text-amber-800 border-amber-300",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      };
    } else {
      return {
        label: `${stock} en stock`,
        class: "bg-green-100 text-green-800 border-green-300",
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with title and buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground">
            Gérez votre catalogue de produits.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un produit
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("/catalog", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir la boutique
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs defaultValue="filter" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="filter">Filtres</TabsTrigger>
              <TabsTrigger value="view">Affichage</TabsTrigger>
            </TabsList>

            {/* Filter Tab */}
            <TabsContent value="filter" className="space-y-4 py-2">
              {/* Filter inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher un produit..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Category dropdown */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Stock filter dropdown */}
                <Select
                  value={stockFilter}
                  onValueChange={(value) =>
                    setStockFilter(value as "all" | "in-stock" | "out-of-stock")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les produits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les produits</SelectItem>
                    <SelectItem value="in-stock">En stock</SelectItem>
                    <SelectItem value="out-of-stock">
                      Rupture de stock
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Featured checkbox and reset button */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={featuredFilter === true}
                      onCheckedChange={(checked) =>
                        setFeaturedFilter(
                          checked === true
                            ? true
                            : checked === false
                            ? false
                            : undefined
                        )
                      }
                    />
                    <label
                      htmlFor="featured"
                      className="text-sm font-medium leading-none"
                    >
                      Produits en vedette
                    </label>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              </div>
            </TabsContent>

            {/* View Tab */}
            <TabsContent value="view" className="py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* View mode toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Mode d'affichage:
                  </span>
                  <div className="border rounded-md p-1 flex">
                    <Button
                      variant={viewMode === "table" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => setViewMode("table")}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Tableau
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 flex-1"
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grille
                    </Button>
                  </div>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Trier par:
                  </span>
                  <Select
                    value={`${sortBy}-${sortDirection}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortDirection] = value.split("-");
                      setSortBy(
                        newSortBy as "name" | "price" | "stock" | "newest"
                      );
                      setSortDirection(newSortDirection as "asc" | "desc");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest-desc">Plus récents</SelectItem>
                      <SelectItem value="newest-asc">Plus anciens</SelectItem>
                      <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Nom (Z-A)</SelectItem>
                      <SelectItem value="price-asc">Prix croissant</SelectItem>
                      <SelectItem value="price-desc">
                        Prix décroissant
                      </SelectItem>
                      <SelectItem value="stock-desc">Stock élevé</SelectItem>
                      <SelectItem value="stock-asc">Stock faible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>

        <CardContent>
          {/* Loading state */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Aucun produit ne correspond à votre recherche.
              </p>
              <Button onClick={resetFilters} variant="outline">
                Réinitialiser les filtres
              </Button>
            </div>
          ) : viewMode === "table" ? (
            // Table view
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center">
                        Produit
                        {sortBy === "name" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead
                      className="text-right cursor-pointer"
                      onClick={() => toggleSort("price")}
                    >
                      <div className="flex items-center justify-end">
                        Prix
                        {sortBy === "price" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-center cursor-pointer"
                      onClick={() => toggleSort("stock")}
                    >
                      <div className="flex items-center justify-center">
                        Stock
                        {sortBy === "stock" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock);

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                            <img
                              src={
                                product.images && product.images.length > 0
                                  ? product.images[0]
                                  : "/placeholder.svg"
                              }
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/placeholder.svg";
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            {product.name}
                            {product.featured && (
                              <Badge
                                variant="outline"
                                className="ml-2 bg-primary/10 text-primary border-primary/20"
                              >
                                En vedette
                              </Badge>
                            )}
                          </div>
                          {product.sku && (
                            <span className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getCategoryName(product.category)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {product.price.toFixed(2)} XAF
                        </TableCell>
                        <TableCell className="text-center">
                          {product.stock ?? "∞"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={stockStatus.class}
                          >
                            <span className="flex items-center">
                              {stockStatus.icon}
                              {stockStatus.label}
                            </span>
                          </Badge>
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
                                onClick={() => handleViewProduct(product)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Détails
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `/product/${product.id}`,
                                    "_blank"
                                  )
                                }
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir en boutique
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicateProduct(product)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(product.id)}
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
          ) : (
            // Grid view
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);

                return (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={
                          product.images && product.images.length > 0
                            ? product.images[0]
                            : "/placeholder.svg"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder.svg";
                        }}
                      />
                      {product.featured && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-primary">En vedette</Badge>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className={stockStatus.class}>
                          <span className="flex items-center">
                            {stockStatus.icon}
                            {stockStatus.label}
                          </span>
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-2 justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewProduct(product)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-1">
                          {product.name}
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-primary font-medium">
                            {product.price.toFixed(2)} XAF
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getCategoryName(product.category)}
                          </span>
                        </div>
                        {product.sku && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 pt-0 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(`/product/${product.id}`, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Voir en boutique
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateProduct(product)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(product.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {filteredProducts.length} sur {products.length}{" "}
            produits
          </div>
        </CardFooter>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[725px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Modifier un produit" : "Ajouter un produit"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            categories={categories}
            product={editingProduct}
            onSubmit={handleSaveProduct}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      {detailProduct && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du produit</DialogTitle>
            </DialogHeader>

            {/* Dialog content (shortened for brevity) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product image section */}
              <div>
                {detailProduct.images && detailProduct.images.length > 0 ? (
                  <div className="aspect-square rounded-md overflow-hidden bg-muted">
                    <img
                      src={detailProduct.images[0]}
                      alt={detailProduct.name}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-md bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">Aucune image</span>
                  </div>
                )}

                {/* Additional images gallery (if present) */}
                {detailProduct.images && detailProduct.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {/* Additional images shown here */}
                  </div>
                )}
              </div>

              {/* Product details section */}
              <div className="space-y-4">
                {/* Product name and price */}
                <div>
                  <h3 className="text-xl font-medium">
                    {detailProduct.name}
                    {detailProduct.featured && (
                      <Badge
                        variant="outline"
                        className="ml-2 bg-primary/10 text-primary border-primary/20"
                      >
                        En vedette
                      </Badge>
                    )}
                  </h3>
                  <p className="text-lg text-primary font-semibold mt-1">
                    {detailProduct.price.toFixed(2)} XAF
                  </p>
                </div>

                <Separator />

                {/* Additional product details (category, stock, etc.) */}
                <div className="space-y-2">
                  {/* Details content here (shortened) */}
                </div>

                <Separator />

                {/* Product descriptions */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Description
                  </p>
                  <p className="text-sm">{detailProduct.description}</p>
                </div>
              </div>
            </div>

            {/* Dialog footer with actions */}
            <DialogFooter className="flex justify-between gap-2 mt-6">
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`/product/${detailProduct.id}`, "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir en boutique
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleEditProduct(detailProduct)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="default"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Fermer
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer ce produit ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit sera définitivement
              supprimé de votre catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProductId(null)}>
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

export default ProductsManagement;
