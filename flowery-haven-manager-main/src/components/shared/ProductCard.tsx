import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { ShoppingBag, Heart, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { cartService } from '@/services/cart.service';
import { wishlistService } from '@/services/wishlist.service';
import { commentService } from '@/services/comment.service';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  
  // Vérifier si le produit est dans la liste de souhaits au chargement
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const isInList = await wishlistService.isInWishlist(product.id);
        setInWishlist(isInList);
      } catch (error) {
        console.error('Error checking wishlist status:', error);
      }
    };
    
    checkWishlist();
  }, [product.id]);

  // Charger le nombre de commentaires
  useEffect(() => {
    const loadCommentCount = async () => {
      try {
        const count = await commentService.getCommentCount(product.id);
        setCommentCount(count);
      } catch (error) {
        console.error('Error loading comment count:', error);
      }
    };
    
    loadCommentCount();
  }, [product.id]);

  const quickAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAddingToCart(true);
    
    try {
      await cartService.addToCart(product.id, 1);
      
      toast.success("Ajouté au panier", {
        description: `${product.name} a été ajouté à votre panier.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error adding product to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (inWishlist) {
        await wishlistService.removeFromWishlist(product.id);
        setInWishlist(false);
        toast.info("Retiré des favoris", {
          description: `${product.name} a été retiré de vos favoris.`,
          duration: 3000,
        });
      } else {
        await wishlistService.addToWishlist({
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0]
        });
        setInWishlist(true);
        toast.success("Ajouté aux favoris", {
          description: `${product.name} a été ajouté à vos favoris.`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Erreur lors de la mise à jour des favoris');
    }
  };

  const isInStock = product.stock === undefined || product.stock > 0;

  return (
    <div 
      className="product-card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square rounded-lg overflow-hidden mb-4 relative">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${!isInStock ? 'opacity-70' : ''}`}
          />
          
          {/* Stock indicator */}
          {product.stock !== undefined && (
            <div className="absolute top-2 right-2 z-10">
              {product.stock > 0 ? (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                  <CheckCircle size={12} className="mr-1" />
                  En stock
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                  <XCircle size={12} className="mr-1" />
                  Rupture
                </span>
              )}
            </div>
          )}
          
          {/* Quick action overlay */}
          <div 
            className={`absolute inset-0 bg-black/5 flex items-center justify-center gap-3 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button 
              onClick={quickAddToCart}
              className={`bg-white text-primary hover:bg-primary hover:text-white transition-colors duration-300 rounded-full p-3 shadow-md transform translate-y-2 group-hover:translate-y-0 ${
                !isInStock || isAddingToCart ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Ajouter au panier"
              disabled={!isInStock || isAddingToCart}
            >
              <ShoppingBag size={20} />
            </button>
            
            <button 
              onClick={toggleWishlist}
              className={`${inWishlist ? 'bg-primary text-white' : 'bg-white text-primary'} hover:bg-primary hover:text-white transition-colors duration-300 rounded-full p-3 shadow-md transform translate-y-2 group-hover:translate-y-0`}
              aria-label={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="font-serif text-lg font-medium">{product.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-primary font-medium">{product.price.toFixed(2)} XAF</p>
            
            {/* Affichage du nombre de commentaires */}
            {commentCount !== null && (
              <span className="text-xs text-muted-foreground flex items-center">
                <MessageSquare size={12} className="mr-1" />
                {commentCount}
              </span>
            )}
          </div>
          {!isInStock && (
            <p className="text-xs text-red-500 mt-1">Rupture de stock</p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;