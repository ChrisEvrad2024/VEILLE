import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs = ({ items, className = '' }: BreadcrumbsProps) => {
  return (
    <nav className={`flex items-center text-sm text-muted-foreground ${className}`}>
      <ol className="flex items-center flex-wrap">
        {/* Home Link */}
        <li className="flex items-center">
          <Link 
            to="/" 
            className="hover:text-foreground transition-colors flex items-center"
            aria-label="Accueil"
          >
            <Home size={14} />
          </Link>
        </li>
        
        {/* Separator after home */}
        <li className="mx-2">
          <ChevronRight size={14} />
        </li>
        
        {/* Breadcrumb Items */}
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {/* Render as link if path is provided */}
            {item.path ? (
              <Link 
                to={item.path} 
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
            
            {/* Render separator except for the last item */}
            {index < items.length - 1 && (
              <span className="mx-2">
                <ChevronRight size={14} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;