// src/contexts/ProductContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category } from '@/types/product';
import { productService } from '@/services/product.service';

interface ProductContextType {
  products: Product[];
  categories: Category[];
  featuredProducts: Product[];
  popularProducts: Product[];
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  getProductsByCategory: (categoryId: string) => Promise<Product[]>;
  getProductById: (id: string) => Promise<Product | null>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [allProducts, allCategories, featured, popular] = await Promise.all([
        productService.getAllProducts(),
        productService.getAllCategories(),
        productService.getFeaturedProducts(),
        productService.getPopularProducts()
      ]);
      
      setProducts(allProducts);
      setCategories(allCategories);
      setFeaturedProducts(featured);
      setPopularProducts(popular);
    } catch (err) {
      console.error('Error loading product data:', err);
      setError('Failed to load product data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    
    // Écouter les événements de mise à jour
    const handleProductsUpdated = () => {
      loadAllData();
    };
    
    window.addEventListener('productsUpdated', handleProductsUpdated);
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated);
    };
  }, []);

  const refreshProducts = async () => {
    await loadAllData();
  };

  const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
    try {
      return await productService.getProductsByCategory(categoryId);
    } catch (err) {
      console.error(`Error getting products for category ${categoryId}:`, err);
      return [];
    }
  };

  const getProductById = async (id: string): Promise<Product | null> => {
    try {
      return await productService.getProductById(id);
    } catch (err) {
      console.error(`Error getting product ${id}:`, err);
      return null;
    }
  };

  const value = {
    products,
    categories,
    featuredProducts,
    popularProducts,
    isLoading,
    error,
    refreshProducts,
    getProductsByCategory,
    getProductById
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  
  return context;
};