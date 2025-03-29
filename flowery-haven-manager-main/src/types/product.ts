export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  stock?: number;
  images: string[];
  category: string;
  popular: boolean;
  featured?: boolean;
  sku?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  tags?: string[];
}