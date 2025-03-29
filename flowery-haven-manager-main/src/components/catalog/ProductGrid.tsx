import { useState } from 'react';
import { Product } from '@/types/product';
import ProductCard from '@/components/shared/ProductCard';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

type ViewMode = 'grid' | 'list';

const ProductGrid = ({ products, isLoading = false }: ProductGridProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-muted aspect-[3/4] rounded-lg mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
        <SlidersHorizontal size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun produit trouvé</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Nous n'avons trouvé aucun produit correspondant à vos critères de recherche. Essayez d'ajuster vos filtres.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Réinitialiser les filtres
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Affichage de <span className="font-medium text-foreground">{products.length}</span> produits
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden md:flex border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-none ${viewMode === 'grid' ? 'bg-muted' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Affichage en grille"
            >
              <Grid size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-none ${viewMode === 'list' ? 'bg-muted' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="Affichage en liste"
            >
              <List size={16} />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <SlidersHorizontal size={16} className="mr-2" />
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mode d'affichage</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setViewMode('grid')}>
                <Grid size={16} className="mr-2" />
                Grille
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('list')}>
                <List size={16} className="mr-2" />
                Liste
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="flex flex-col sm:flex-row gap-4 border border-border rounded-lg overflow-hidden bg-background"
            >
              <div className="sm:w-1/3 aspect-[4/3] sm:aspect-auto">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <h3 className="font-serif text-lg font-medium mb-2">{product.name}</h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                  <span className="text-lg text-primary font-medium">{product.price.toFixed(2)} XAF</span>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      // Ajouter au panier (à implémenter)
                    }}
                  >
                    Ajouter au panier
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;