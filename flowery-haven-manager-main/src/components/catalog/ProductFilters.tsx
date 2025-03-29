import { useState } from 'react';
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
  onReset
}: ProductFiltersProps) => {
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [priceValues, setPriceValues] = useState<[number, number]>([0, 100]);
  const [minPrice, setMinPrice] = useState<string>("0");
  const [maxPrice, setMaxPrice] = useState<string>("100");
  
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
    setFilters(defaultFilters);
    setPriceValues(defaultFilters.priceRange);
    setMinPrice(defaultFilters.priceRange[0].toString());
    setMaxPrice(defaultFilters.priceRange[1].toString());
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
            defaultValue={[priceValues[0], priceValues[1]]}
            min={0}
            max={200}
            step={1}
            value={[priceValues[0], priceValues[1]]}
            onValueChange={handlePriceRangeChange}
            className="py-4"
          />
          
          <div className="flex items-center justify-between gap-4">
            <div className="w-full">
              <Label htmlFor="min-price" className="text-sm font-medium mb-1 block">Min</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">XAF</span>
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
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">XAF</span>
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