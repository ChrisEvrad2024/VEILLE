import { Link } from 'react-router-dom';
import { Category } from '@/types/category';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  imagePlaceholder?: string;
  showDescription?: boolean;
  className?: string;
}

const CategoryCard = ({ 
  category, 
  imagePlaceholder = 'https://images.unsplash.com/photo-1487700160041-babef9c3cb55?q=80&w=1952',
  showDescription = true,
  className = ''
}: CategoryCardProps) => {
  // Utiliser l'image de la catégorie ou une image par défaut
  const imageUrl = category.image || imagePlaceholder;
  
  return (
    <Link 
      to={`/catalog?category=${category.id}`}
      className={`group block rounded-lg overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img 
          src={imageUrl} 
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-6">
          <h3 className="text-white font-serif text-xl md:text-2xl">{category.name}</h3>
        </div>
      </div>
      
      {showDescription && (
        <div className="p-4 bg-white">
          <p className="text-muted-foreground mb-3 line-clamp-2">{category.description}</p>
          <span className="inline-flex items-center text-primary group-hover:underline">
            Découvrir
            <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      )}
    </Link>
  );
};

export default CategoryCard;