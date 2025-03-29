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
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Récupérer tous les produits et catégories depuis la base de données
        const allProducts = await productService.getAllProducts();
        const allCategories = await productService.getAllCategories();
        
        setProducts(allProducts);
        setCategories(allCategories);
      } catch (error) {
        console.error("Error loading catalog data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);


  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load categories
      const allCategories = getAllCategories();
      setCategories(allCategories);
      
      // Load products based on category parameter
      let loadedProducts: Product[];
      if (categoryParam) {
        loadedProducts = getProductsByCategory(categoryParam);
      } else {
        loadedProducts = getAllProducts();
      }
      
      setProducts(loadedProducts);
      setFilteredProducts(loadedProducts);
      setIsLoading(false);
    };
    
    loadData();
  }, [categoryParam]);
  
  // Apply filters whenever products or filters change
  useEffect(() => {
    if (isLoading) return;
    
    let result = [...products];
    
    // Apply search filter if there's a search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
    }
    
    // Apply price filter
    result = result.filter(product => 
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    );
    
    // Apply stock filter
    if (filters.inStock) {
      result = result.filter(product => 
        product.stock === undefined || product.stock > 0
      );
    }
    
    // Apply featured filter
    if (filters.featured) {
      result = result.filter(product => product.featured);
    }
    
    // Apply popular filter
    if (filters.popular) {
      result = result.filter(product => product.popular);
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
        break;
      case 'newest':
      default:
        // Assuming newer products have higher IDs
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
    }
    
    setFilteredProducts(result);
  }, [products, filters, searchQuery, isLoading]);
  
  // Handle category change
  const handleCategoryChange = (categoryId: string | null) => {
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
    setFilters(newFilters);
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
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