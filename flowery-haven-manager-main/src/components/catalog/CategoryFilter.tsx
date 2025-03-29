import { useState } from 'react';
import { getAllCategories } from '@/lib/data';
import { CheckCircle } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const categories = getAllCategories();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={handleToggleExpand}>
        <h3 className="font-serif text-xl">Catégories</h3>
        <button 
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isExpanded ? "Réduire les catégories" : "Développer les catégories"}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      {isExpanded && (
        <ul className="space-y-2">
          <li>
            <button 
              className={`w-full text-left py-2 px-3 rounded-md transition-colors flex items-center justify-between ${
                !selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
              onClick={() => onCategoryChange(null)}
            >
              <span>Tous les produits</span>
              {!selectedCategory && <CheckCircle size={16} className="text-primary" />}
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <button 
                className={`w-full text-left py-2 px-3 rounded-md transition-colors flex items-center justify-between ${
                  selectedCategory === category.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
                onClick={() => onCategoryChange(category.id)}
              >
                <span>{category.name}</span>
                {selectedCategory === category.id && <CheckCircle size={16} className="text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategoryFilter;