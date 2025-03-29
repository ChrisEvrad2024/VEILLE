import { Link } from 'react-router-dom';
import { getAllCategories } from '@/lib/data';
import { ChevronRight } from 'lucide-react';

const CategoryShowcase = () => {
  const categories = getAllCategories();
  
  // Images pour chaque catégorie - dans une application réelle, 
  // ces URLs seraient stockées dans la base de données
  const categoryImages: {[key: string]: string} = {
    'fresh-flowers': 'https://images.unsplash.com/photo-1533654977496-563ce60f7353?q=80&w=2071',
    'bouquets': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=2070',
    'potted-plants': 'https://images.unsplash.com/photo-1685726868126-b50970dbb071?q=80&w=1938',
    'floral-decor': 'https://images.unsplash.com/photo-1562684750-0553aea39268?q=80&w=2060',
    // Fallback image for any missing category
    'default': 'https://images.unsplash.com/photo-1487700160041-babef9c3cb55?q=80&w=1952'
  };
  
  // Fonction pour obtenir l'image d'une catégorie
  const getCategoryImage = (categoryId: string) => {
    return categoryImages[categoryId] || categoryImages['default'];
  };
  
  return (
    <section className="section-container">
      <div className="text-center mb-16">
        <span className="inline-block text-xs uppercase tracking-widest mb-3 text-primary font-medium">
          Explorez Notre Collection
        </span>
        <h2 className="section-title">Catégories</h2>
        <p className="section-subtitle max-w-2xl mx-auto">
          Découvrez notre sélection de produits floraux soigneusement organisés par catégories.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {categories.map((category) => (
          <Link 
            key={category.id} 
            to={`/catalog?category=${category.id}`}
            className="group block"
          >
            <div className="aspect-square rounded-lg overflow-hidden mb-4 relative">
              <img 
                src={getCategoryImage(category.id)} 
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <h3 className="text-white font-serif text-xl md:text-2xl">{category.name}</h3>
              </div>
            </div>
            <p className="text-muted-foreground mb-3 line-clamp-2">{category.description}</p>
            <span className="inline-flex items-center text-primary group-hover:underline">
              Découvrir
              <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryShowcase;