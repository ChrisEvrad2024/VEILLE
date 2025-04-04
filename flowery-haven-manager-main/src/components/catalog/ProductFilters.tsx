import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CategoryFilter from './CategoryFilter';

interface ProductFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onFiltersChange: (filters: ProductFilters) => void;
  onReset: () => void;
  initialFilters?: Partial<ProductFilters>;
}

export interface ProductFilters {
  priceRange: [number, number];
  inStock: boolean;
  featured: boolean;
  popular: boolean;
  sortBy: 'price-asc' | 'price-desc' | 'newest' | 'popularity';
}

// Default values for filters
const defaultFilters: ProductFilters = {
  priceRange: [0, 100],
  inStock: false,
  featured: false,
  popular: false,
  sortBy: 'newest'
};

const ProductFilters = ({ 
  selectedCategory, 
  onCategoryChange, 
  onFiltersChange,
  onReset,
  initialFilters = {}
}: ProductFiltersProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>({
    ...defaultFilters,
    ...initialFilters
  });
  const [priceValues, setPriceValues] = useState<[number, number]>(filters.priceRange);
  const [minPrice, setMinPrice] = useState<string>(filters.priceRange[0].toString());
  const [maxPrice, setMaxPrice] = useState<string>(filters.priceRange[1].toString());
  
  // Initialize filters from URL on first load
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    
    const initialFilters: Partial<ProductFilters> = {};
    
    if (params.minPrice && params.maxPrice) {
      const min = parseInt(params.minPrice, 10) || 0;
      const max = parseInt(params.maxPrice, 10) || 100;
      initialFilters.priceRange = [min, max];
      setPriceValues([min, max]);
      setMinPrice(min.toString());
      setMaxPrice(max.toString());
    }
    
    if (params.inStock) {
      initialFilters.inStock = params.inStock === 'true';
    }
    
    if (params.featured) {
      initialFilters.featured = params.featured === 'true';
    }
    
    if (params.popular) {
      initialFilters.popular = params.popular === 'true';
    }
    
    if (params.sortBy && ['price-asc', 'price-desc', 'newest', 'popularity'].includes(params.sortBy)) {
      initialFilters.sortBy = params.sortBy as ProductFilters['sortBy'];
    }
    
    // Only update if we have any parameters
    if (Object.keys(initialFilters).length > 0) {
      const newFilters = { ...filters, ...initialFilters };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    }
  }, []);
  
  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    
    // Only add parameters that differ from defaults
    if (filters.priceRange[0] !== defaultFilters.priceRange[0]) {
      newParams.set('minPrice', filters.priceRange[0].toString());
    } else {
      newParams.delete('minPrice');
    }
    
    if (filters.priceRange[1] !== defaultFilters.priceRange[1]) {
      newParams.set('maxPrice', filters.priceRange[1].toString());
    } else {
      newParams.delete('maxPrice');
    }
    
    if (filters.inStock !== defaultFilters.inStock) {
      newParams.set('inStock', filters.inStock.toString());
    } else {
      newParams.delete('inStock');
    }
    
    if (filters.featured !== defaultFilters.featured) {
      newParams.set('featured', filters.featured.toString());
    } else {
      newParams.delete('featured');
    }
    
    if (filters.popular !== defaultFilters.popular) {
      newParams.set('popular', filters.popular.toString());
    } else {
      newParams.delete('popular');
    }
    
    if (filters.sortBy !== defaultFilters.sortBy) {
      newParams.set('sortBy', filters.sortBy);
    } else {
      newParams.delete('sortBy');
    }
    
    // Keep category parameter if it exists
    if (selectedCategory) {
      newParams.set('category', selectedCategory);
    }
    
    setSearchParams(newParams, { replace: true });
  }, [filters, selectedCategory]);
  
  // Handle price range changes from slider
  const handlePriceRangeChange = (values: number[]) => {
    const newRange = [values[0], values[1]] as [number, number];
    setPriceValues(newRange);
    setMinPrice(newRange[0].toString());
    setMaxPrice(newRange[1].toString());
    
    const updatedFilters = { ...filters, priceRange: newRange };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };
  
  // Handle min price input change
  const handleMinPriceChange = (value: string) => {
    setMinPrice(value);
    const numValue = parseFloat(value) || 0;
    const newRange: [number, number] = [
      Math.min(numValue, priceValues[1]),
      priceValues[1]
    ];
    setPriceValues(newRange);
    
    const updatedFilters = { ...filters, priceRange: newRange };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };
  
  // Handle max price input change
  const handleMaxPriceChange = (value: string) => {
    setMaxPrice(value);
    const numValue = parseFloat(value) || 0;
    const newRange: [number, number] = [
      priceValues[0],
      Math.max(numValue, priceValues[0])
    ];
    setPriceValues(newRange);
    
    const updatedFilters = { ...filters, priceRange: newRange };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };
  
  // Handle toggle filters
  const handleToggleFilter = (filterName: 'inStock' | 'featured' | 'popular', value: boolean) => {
    const updatedFilters = { ...filters, [filterName]: value };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };
  
  // Handle sort change
  const handleSortChange = (sortValue: ProductFilters['sortBy']) => {
    const updatedFilters = { ...filters, sortBy: sortValue };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
    // Reset state
    setPriceValues(defaultFilters.priceRange);
    setMinPrice(defaultFilters.priceRange[0].toString());
    setMaxPrice(defaultFilters.priceRange[1].toString());
    setFilters(defaultFilters);
    
    // Reset URL parameters
    const newParams = new URLSearchParams();
    if (selectedCategory) {
      newParams.set('category', selectedCategory);
    }
    setSearchParams(newParams, { replace: true });
    
    // Notify parent
    onFiltersChange(defaultFilters);
    onReset();
  };
  
  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <CategoryFilter 
        selectedCategory={selectedCategory} 
        onCategoryChange={onCategoryChange} 
      />
      
      {/* Sort By */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h3 className="font-serif text-xl mb-4">Trier par</h3>
        <Select 
          value={filters.sortBy}
          onValueChange={(value) => handleSortChange(value as ProductFilters['sortBy'])}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un tri" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Les plus récents</SelectItem>
            <SelectItem value="price-asc">Prix croissant</SelectItem>
            <SelectItem value="price-desc">Prix décroissant</SelectItem>
            <SelectItem value="popularity">Popularité</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Price Range */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h3 className="font-serif text-xl mb-4">Prix</h3>
        <div className="space-y-6">
          <Slider
            value={priceValues}
            min={0}
            max={200}
            step={1}
            onValueChange={handlePriceRangeChange}
            className="py-4"
          />
          
          <div className="flex items-center justify-between gap-4">
            <div className="w-full">
              <Label htmlFor="min-price" className="text-sm font-medium mb-1 block">Min</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></span>
                <Input
                  id="min-price"
                  className="pl-7"
                  type="number"
                  min={0}
                  max={priceValues[1]}
                  value={minPrice}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full">
              <Label htmlFor="max-price" className="text-sm font-medium mb-1 block">Max</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></span>
                <Input
                  id="max-price"
                  className="pl-7"
                  type="number"
                  min={priceValues[0]}
                  value={maxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Filters */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <h3 className="font-serif text-xl mb-4">Filtres</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="in-stock" className="cursor-pointer">
              En stock uniquement
            </Label>
            <Switch 
              id="in-stock" 
              checked={filters.inStock}
              onCheckedChange={(checked) => handleToggleFilter('inStock', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="featured" className="cursor-pointer">
              Produits en vedette
            </Label>
            <Switch 
              id="featured" 
              checked={filters.featured}
              onCheckedChange={(checked) => handleToggleFilter('featured', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="popular" className="cursor-pointer">
              Produits populaires
            </Label>
            <Switch 
              id="popular" 
              checked={filters.popular}
              onCheckedChange={(checked) => handleToggleFilter('popular', checked)}
            />
          </div>
        </div>
      </div>
      
      {/* Reset Filters Button */}
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-center gap-2"
        onClick={handleResetFilters}
      >
        <RefreshCw size={14} />
        Réinitialiser les filtres
      </Button>
    </div>
  );
};

export default ProductFilters;