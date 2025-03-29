import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllProducts, getAllCategories, getProductsByCategory } from '@/lib/data';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductGrid from '@/components/catalog/ProductGrid';
import ProductFilters, { ProductFilters as FiltersType } from '@/components/catalog/ProductFilters';
import Breadcrumbs from '@/components/catalog/Breadcrumbs';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { productService } from "@/services/product.service";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Catalog = () => {
  console.log("🔄 Catalog component rendering");
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  // Get category from URL params
  const categoryParam = searchParams.get('category');
  const searchQuery = searchParams.get('q') || '';
  
  // Default filters
  const defaultFilters: FiltersType = {
    priceRange: [0, 100],
    inStock: false,
    featured: false,
    popular: false,
    sortBy: 'newest'
  };
  
  // Current filters state
  const [filters, setFilters] = useState<FiltersType>(defaultFilters);
  
  // Get current category object
  const currentCategory = categories.find(cat => cat.id === categoryParam);

  // LOG EFFECT: Tracer les changements d'état
  useEffect(() => {
    console.log("📊 Products state changed:", products.length);
  }, [products]);

  useEffect(() => {
    console.log("🔍 Filtered products changed:", filteredProducts.length);
  }, [filteredProducts]);

  useEffect(() => {
    console.log("⏳ Loading state changed:", isLoading);
  }, [isLoading]);
  
  // EFFECT 1: Charger les données en fonction de la catégorie
  useEffect(() => {
    console.log("🔄 EFFECT 1 running - categoryParam changed to:", categoryParam);
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log("📥 EFFECT 1: Fetching data based on category");
        let productData;
        if (categoryParam) {
          productData = await productService.getProductsByCategory(categoryParam);
          console.log(`📦 EFFECT 1: Got ${productData.length} products for category ${categoryParam}`);
        } else {
          productData = await productService.getAllProducts();
          console.log(`📦 EFFECT 1: Got ${productData.length} products (all categories)`);
        }
        const categoriesData = await productService.getAllCategories();
        console.log(`🏷️ EFFECT 1: Got ${categoriesData.length} categories`);
        
        setProducts(productData);
        setFilteredProducts(productData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("❌ EFFECT 1: Error loading catalog data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [categoryParam]);

  // EFFECT 2: Charger toutes les données indépendamment de la catégorie
  useEffect(() => {
    console.log("🔄 EFFECT 2 running - no dependencies");
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log("📥 EFFECT 2: Fetching all products and categories");
        // Récupérer tous les produits et catégories depuis la base de données
        const allProducts = await productService.getAllProducts();
        console.log(`📦 EFFECT 2: Got ${allProducts.length} products`);
        
        const allCategories = await productService.getAllCategories();
        console.log(`🏷️ EFFECT 2: Got ${allCategories.length} categories`);
        
        setProducts(allProducts);
        setCategories(allCategories);
      } catch (error) {
        console.error("❌ EFFECT 2: Error loading catalog data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Commenter cette ligne pour désactiver cet effet
    // loadData();
    console.log("⚠️ EFFECT 2: Désactivé pour éviter les conflits avec les autres effets");
  }, []);

  // EFFECT 3: Charger les données à partir du lib/data (fonctions locales)
  useEffect(() => {
    console.log("🔄 EFFECT 3 running - categoryParam changed to:", categoryParam);
    const loadData = async () => {
      setIsLoading(true);
      
      console.log("📥 EFFECT 3: Loading data from local functions");
      // Load categories
      const allCategories = getAllCategories();
      console.log(`🏷️ EFFECT 3: Got ${allCategories.length} categories from local functions`);
      
      // Load products based on category parameter
      let loadedProducts: Product[];
      if (categoryParam) {
        loadedProducts = getProductsByCategory(categoryParam);
        console.log(`📦 EFFECT 3: Got ${loadedProducts.length} products for category ${categoryParam} from local functions`);
      } else {
        loadedProducts = getAllProducts();
        console.log(`📦 EFFECT 3: Got ${loadedProducts.length} products (all categories) from local functions`);
      }
      
      // Commenter ces lignes pour désactiver l'effet sur les données
      // setProducts(loadedProducts);
      // setFilteredProducts(loadedProducts);
      console.log("⚠️ EFFECT 3: Désactivé pour éviter les conflits avec les autres effets");
      
      setIsLoading(false);
    };
    
    // Commenter cette ligne pour désactiver cet effet
    // loadData();
    console.log("⚠️ EFFECT 3: Désactivé pour éviter les conflits avec les autres effets");
  }, [categoryParam]);
  
  // EFFECT 4: Appliquer les filtres
  useEffect(() => {
    console.log("🔄 EFFECT 4 running - applying filters");
    console.log(`📊 Current products: ${products.length}, isLoading: ${isLoading}`);
    
    if (isLoading) {
      console.log("⏳ Skipping filter application - still loading");
      return;
    }
    
    if (products.length === 0) {
      console.log("⚠️ No products to filter - keeping filtered products as is");
      return;
    }
    
    let result = [...products];
    console.log(`🔍 Starting filter with ${result.length} products`);
    
    // Apply search filter if there's a search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
      console.log(`🔍 After search filter: ${result.length} products`);
    }
    
    // Apply price filter
    result = result.filter(product => 
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    );
    console.log(`🔍 After price filter: ${result.length} products`);
    
    // Apply stock filter
    if (filters.inStock) {
      result = result.filter(product => 
        product.stock === undefined || product.stock > 0
      );
      console.log(`🔍 After stock filter: ${result.length} products`);
    }
    
    // Apply featured filter
    if (filters.featured) {
      result = result.filter(product => product.featured);
      console.log(`🔍 After featured filter: ${result.length} products`);
    }
    
    // Apply popular filter
    if (filters.popular) {
      result = result.filter(product => product.popular);
      console.log(`🔍 After popular filter: ${result.length} products`);
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        console.log(`🔍 Sorted by price ascending`);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        console.log(`🔍 Sorted by price descending`);
        break;
      case 'popularity':
        result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
        console.log(`🔍 Sorted by popularity`);
        break;
      case 'newest':
      default:
        // Assuming newer products have higher IDs
        result.sort((a, b) => b.id.localeCompare(a.id));
        console.log(`🔍 Sorted by newest`);
        break;
    }
    
    // Protection contre les résultats vides non désirés
    if (result.length === 0 && products.length > 0) {
      console.warn("⚠️ Filters produced empty result despite having products. Showing all products instead.");
      setFilteredProducts(products);
    } else {
      console.log(`✅ Setting filtered products to ${result.length} items`);
      setFilteredProducts(result);
    }
  }, [products, filters, searchQuery, isLoading]);
  
  // Handle category change
  const handleCategoryChange = (categoryId: string | null) => {
    console.log(`🔄 Category changed to: ${categoryId}`);
    if (categoryId) {
      setSearchParams({ category: categoryId });
    } else {
      setSearchParams({});
    }
    // Close mobile filter on category change
    setIsMobileFilterOpen(false);
  };
  
  // Handle filters change
  const handleFiltersChange = (newFilters: FiltersType) => {
    console.log(`🔄 Filters changed:`, newFilters);
    setFilters(newFilters);
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
    console.log(`🔄 Filters reset to defaults`);
    setFilters(defaultFilters);
    setSearchParams(categoryParam ? { category: categoryParam } : {});
  };
  
  // Generate breadcrumbs items
  const breadcrumbItems = [
    { label: 'Catalogue', path: '/catalog' },
    ...(currentCategory ? [{ label: currentCategory.name }] : []),
    ...(searchQuery ? [{ label: `Recherche: "${searchQuery}"` }] : [])
  ];
  
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-16">
        <div className="container max-w-7xl mx-auto px-4 lg:px-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-8" />
          
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-medium mb-2">
              {currentCategory ? currentCategory.name : 'Tous nos produits'}
            </h1>
            {currentCategory && (
              <p className="text-muted-foreground">
                {currentCategory.description}
              </p>
            )}
          </div>
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-6">
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full flex justify-between">
                  <span className="flex items-center">
                    <Filter size={18} className="mr-2" />
                    Filtrer
                  </span>
                  <span className="flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {filteredProducts.length} produits
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-md overflow-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                <ProductFilters
                  selectedCategory={categoryParam}
                  onCategoryChange={handleCategoryChange}
                  onFiltersChange={handleFiltersChange}
                  onReset={handleResetFilters}
                />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block lg:w-1/4 space-y-6">
              <ProductFilters
                selectedCategory={categoryParam}
                onCategoryChange={handleCategoryChange}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
              />
            </aside>
            
            {/* Products Grid */}
            <div className="lg:w-3/4">
              <ProductGrid products={filteredProducts} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Catalog;