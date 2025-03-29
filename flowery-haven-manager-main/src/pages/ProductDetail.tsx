import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { addToRecentlyViewed, getRecentlyViewed } from '@/lib/recentlyViewed';
import { addToWishlist, removeFromWishlist, isInWishlist } from '@/lib/wishlist';
import { addToCart } from '@/lib/cart';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shared/ProductCard';
import Breadcrumbs from '@/components/catalog/Breadcrumbs';
import { 
  Minus, 
  Plus, 
  ShoppingBag, 
  Heart, 
  Share2, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Copy,
  Info,
  Truck,
  Package,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Importer productService au lieu des fonctions de lib/data
import { productService } from "@/services/product.service";
import { Product, Category } from "@/types/product";

// Mock color options for demonstration
const COLORS = [
  { name: 'Rouge', value: '#DC2626' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Blanc', value: '#F9FAFB' },
  { name: 'Jaune', value: '#FBBF24' },
  { name: 'Bleu', value: '#3B82F6' },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // États pour les données chargées de façon asynchrone
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Autres états du composant
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  
  // Déterminer si le produit est en stock
  const isInStock = product?.stock === undefined || (product?.stock || 0) > 0;
  
  // Obtenir le nom de la catégorie
  const categoryName = product && categories.length > 0 ? 
    categories.find(cat => cat.id === product.category)?.name || product.category : 
    '';

  // Charger les données du produit et des catégories
  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log("Chargement des données du produit:", id);
        
        // Charger le produit
        const productData = await productService.getProductById(id);
        if (!productData) {
          console.error("Produit non trouvé:", id);
          setLoadError("Le produit demandé n'existe pas ou a été supprimé.");
          setProduct(null);
          setIsLoading(false);
          return;
        }
        
        console.log("Produit trouvé:", productData);
        setProduct(productData);
        
        // Charger les catégories
        const allCategories = await productService.getAllCategories();
        console.log("Catégories chargées:", allCategories.length);
        setCategories(allCategories);
        
        // Charger les produits similaires (de la même catégorie)
        if (productData.category) {
          const categoryProducts = await productService.getProductsByCategory(productData.category);
          console.log("Produits de la même catégorie:", categoryProducts.length);
          setRelatedProducts(
            categoryProducts
              .filter(p => p.id !== productData.id)
              .slice(0, 4)
          );
        }
        
        // Charger les produits populaires
        const popularProds = await productService.getPopularProducts();
        console.log("Produits populaires:", popularProds.length);
        setPopularProducts(
          popularProds
            .filter(p => p.id !== productData.id)
            .slice(0, 4)
        );
        
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setLoadError("Une erreur est survenue lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProductData();
  }, [id]);
  
  // Gérer le stockage local (recently viewed, wishlist, etc.)
  useEffect(() => {
    // Reset scroll position when navigating to a new product
    window.scrollTo(0, 0);
    
    if (product) {
      // Reset state when product changes
      setQuantity(1);
      setSelectedImage(0);
      setInWishlist(isInWishlist(product.id));
      setSelectedColor(COLORS[0]);
      
      // Add to recently viewed
      addToRecentlyViewed(product);
      
      // Get recently viewed products (exclude current product)
      const viewed = getRecentlyViewed().filter(item => item.id !== product.id);
      setRecentlyViewed(viewed);
    }
  }, [product]);
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-16 min-h-screen">
          <div className="container max-w-7xl mx-auto px-4 lg:px-8">
            <div className="animate-pulse space-y-8">
              <div className="h-6 w-2/3 bg-muted rounded"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="aspect-square bg-muted rounded"></div>
                <div className="space-y-4">
                  <div className="h-8 w-3/4 bg-muted rounded"></div>
                  <div className="h-4 w-1/2 bg-muted rounded"></div>
                  <div className="h-8 w-1/3 bg-muted rounded"></div>
                  <div className="h-20 w-full bg-muted rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  if (loadError || !product) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-16 min-h-screen">
          <div className="container max-w-7xl mx-auto px-4 lg:px-8 text-center">
            <h1 className="text-2xl font-serif mb-4">Produit non trouvé</h1>
            <p className="mb-8">{loadError || "Le produit que vous recherchez n'existe pas ou a été retiré."}</p>
            <Link to="/catalog" className="btn-primary inline-flex">
              Retour à la boutique
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    // Limit quantity to stock level if stock is defined
    if (product.stock !== undefined && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else if (product.stock === undefined) {
      setQuantity(quantity + 1);
    } else {
      toast.error("Quantité maximale atteinte", {
        description: "Vous avez atteint le maximum de stock disponible.",
        duration: 3000,
      });
    }
  };
  
  const addProductToCart = () => {
    if (product && isInStock) {
      addToCart(product, quantity);
      toast.success("Ajouté au panier", {
        description: `${product.name} (${quantity}) a été ajouté à votre panier.`,
        duration: 3000,
      });
      
      // Dispatch custom event to update cart icon
      window.dispatchEvent(new Event('cartUpdated'));
    } else {
      toast.error("Produit en rupture de stock", {
        description: "Ce produit n'est actuellement pas disponible.",
        duration: 3000,
      });
    }
  };
  
  const toggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      setInWishlist(false);
      toast.info("Retiré des favoris", {
        description: `${product.name} a été retiré de vos favoris.`,
        duration: 3000,
      });
    } else {
      addToWishlist({
        id: product.id,
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
  };
  
  const shareProduct = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsLinkCopied(true);
    toast.success("Lien copié !", {
      description: "Le lien du produit a été copié dans le presse-papier.",
      duration: 3000,
    });
    
    setTimeout(() => {
      setIsLinkCopied(false);
    }, 3000);
  };
  
  const shareToSocial = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Découvrez ${product.name} - Flora Express`);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };
  
  // Generate breadcrumbs
  const breadcrumbItems = [
    { label: 'Catalogue', path: '/catalog' },
    { label: categoryName, path: `/catalog?category=${product.category}` },
    { label: product.name }
  ];
  
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-16">
        <div className="container max-w-7xl mx-auto px-4 lg:px-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div 
                className={`aspect-square overflow-hidden rounded-lg bg-muted relative ${
                  !isInStock ? 'after:absolute after:inset-0 after:bg-black/5' : ''
                }`}
              >
                <img 
                  src={product.images[selectedImage]} 
                  alt={product.name}
                  className="w-full h-full object-cover animate-fade-in"
                />
                
                {/* Out of stock overlay */}
                {!isInStock && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                      En rupture de stock
                    </div>
                  </div>
                )}
                
                {/* Sale badge or other indicators can go here */}
              </div>
              
              {product.images.length > 1 && (
                <div className="flex gap-4 flex-wrap">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      className={`aspect-square rounded-md overflow-hidden w-20 border-2 transition-all ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img 
                        src={image} 
                        alt={`${product.name} - vue ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <Link 
                      to={`/catalog?category=${product.category}`}
                      className="inline-block text-sm text-primary hover:underline mb-2"
                    >
                      {categoryName}
                    </Link>
                    <h1 className="text-3xl lg:text-4xl font-serif font-medium mb-2">{product.name}</h1>
                  </div>
                  
                  {/* Stock indicator */}
                  {product.stock !== undefined && (
                    <div className="flex-shrink-0">
                      {product.stock > 0 ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                          <CheckCircle size={12} className="mr-1" />
                          En stock
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                          <XCircle size={12} className="mr-1" />
                          Rupture
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Short description */}
                {product.shortDescription && (
                  <p className="text-muted-foreground mb-4">{product.shortDescription}</p>
                )}
                
                <p className="text-2xl text-primary font-medium">{product.price.toFixed(2)} XAF</p>
                
                {/* SKU */}
                {product.sku && (
                  <p className="text-sm text-muted-foreground mt-2">
                    SKU: <span className="font-medium">{product.sku}</span>
                  </p>
                )}
              </div>
              
              {/* Color selector */}
              <div>
                <h3 className="font-medium mb-4">Couleur</h3>
                <div className="flex gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedColor.name === color.name ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={color.name}
                    >
                      {selectedColor.name === color.name && (
                        <CheckCircle size={16} className={`text-${color.name === 'Blanc' ? 'black' : 'white'}`} />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Couleur sélectionnée: <span className="font-medium">{selectedColor.name}</span>
                </p>
              </div>
              
              <div className="pt-4">
                <h3 className="font-medium mb-4">Quantité</h3>
                <div className="flex items-center">
                  <button 
                    className="border border-border rounded-l-md p-3 hover:bg-muted transition-colors"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1 || !isInStock}
                  >
                    <Minus size={16} />
                  </button>
                  <div className="border-t border-b border-border px-6 py-2 flex items-center justify-center min-w-[60px]">
                    {quantity}
                  </div>
                  <button 
                    className="border border-border rounded-r-md p-3 hover:bg-muted transition-colors"
                    onClick={increaseQuantity}
                    disabled={!isInStock || (product.stock !== undefined && quantity >= product.stock)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                {/* Display available stock if defined */}
                {product.stock !== undefined && product.stock > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {product.stock} unités disponibles
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  className={`btn-primary flex-1 flex items-center justify-center gap-2 ${
                    !isInStock ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={addProductToCart}
                  disabled={!isInStock}
                >
                  <ShoppingBag size={18} /> Ajouter au panier
                </button>
                <button 
                  className={`btn-outline flex items-center justify-center gap-2 ${inWishlist ? 'border-primary text-primary' : ''}`}
                  onClick={toggleWishlist}
                >
                  <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} /> Favoris
                </button>
              </div>
              
              {/* Shipping info */}
              <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-2">
                  <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Livraison gratuite</p>
                    <p className="text-xs text-muted-foreground">À partir de 50XAF d'achat</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Retours faciles</p>
                    <p className="text-xs text-muted-foreground">14 jours pour changer d'avis</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Garantie fraîcheur</p>
                    <p className="text-xs text-muted-foreground">Satisfaction garantie</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Livraison rapide</p>
                    <p className="text-xs text-muted-foreground">24-48h selon votre zone</p>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* Social sharing */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium">Partager:</span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => shareToSocial('facebook')}
                    aria-label="Partager sur Facebook"
                    className="rounded-full"
                  >
                    <Facebook size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => shareToSocial('twitter')}
                    aria-label="Partager sur Twitter"
                    className="rounded-full"
                  >
                    <Twitter size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => shareToSocial('linkedin')}
                    aria-label="Partager sur LinkedIn"
                    className="rounded-full"
                  >
                    <Linkedin size={16} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={shareProduct}
                    aria-label="Copier le lien"
                    className="rounded-full"
                  >
                    {isLinkCopied ? <CheckCircle size={16} className="text-primary" /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Details Tabs */}
          <div className="mt-16">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="shipping">Livraison</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="bg-white p-6 rounded-lg border">
                <div className="prose max-w-none">
                  <p>{product.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="details" className="bg-white p-6 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Caractéristiques</h3>
                    <table className="w-full">
                      <tbody>
                        {product.sku && (
                          <tr className="border-b">
                            <td className="py-3 text-muted-foreground">Référence (SKU)</td>
                            <td className="py-3 font-medium">{product.sku}</td>
                          </tr>
                        )}
                        <tr className="border-b">
                          <td className="py-3 text-muted-foreground">Catégorie</td>
                          <td className="py-3 font-medium">{categoryName}</td>
                        </tr>
                        {product.weight && (
                          <tr className="border-b">
                            <td className="py-3 text-muted-foreground">Poids</td>
                            <td className="py-3 font-medium">{product.weight} kg</td>
                          </tr>
                        )}
                        {product.dimensions && (
                          <tr className="border-b">
                            <td className="py-3 text-muted-foreground">Dimensions</td>
                            <td className="py-3 font-medium">
                              {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                            </td>
                          </tr>
                        )}
                        <tr className="border-b">
                          <td className="py-3 text-muted-foreground">Disponibilité</td>
                          <td className="py-3 font-medium">
                            {isInStock ? 'En stock' : 'Rupture de stock'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Soins & Entretien</h3>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Comment prolonger la vie de vos fleurs</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground mb-2">Pour maximiser la durée de vie de vos fleurs, suivez ces conseils simples :</p>
                          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                            <li>Changez l'eau tous les 2-3 jours</li>
                            <li>Coupez les tiges en biseau tous les 2-3 jours</li>
                            <li>Gardez les fleurs à l'écart de la lumière directe du soleil</li>
                            <li>Évitez de placer les fleurs près des fruits (l'éthylène accélère leur flétrissement)</li>
                            <li>Utilisez le sachet de conservateur fourni avec le bouquet</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-2">
                        <AccordionTrigger>Allergies et précautions</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">
                            Certaines fleurs peuvent provoquer des réactions allergiques chez les personnes sensibles. Si vous ou vos proches avez des antécédents d'allergies, prenez en compte ces précautions. Gardez également les fleurs hors de portée des enfants et des animaux domestiques, car certaines espèces peuvent être toxiques si elles sont ingérées.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-3">
                        <AccordionTrigger>Soins spécifiques par saison</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">
                            En été, les fleurs peuvent se déshydrater plus rapidement. Gardez-les dans un endroit frais et loin des climatiseurs directs. En hiver, évitez de les placer près des radiateurs ou sources de chaleur. L'humidité ambiante étant généralement plus basse en hiver, pensez à vaporiser légèrement vos fleurs pour maintenir leur fraîcheur.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="bg-white p-6 rounded-lg border">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Options de livraison</h3>
                    <p className="text-muted-foreground mb-4">
                      Nous proposons plusieurs options de livraison pour répondre à vos besoins. 
                      Toutes nos livraisons sont effectuées avec soin pour garantir la fraîcheur de nos produits.
                    </p>
                    
                    <table className="w-full border-collapse mb-6">
                      <thead className="bg-muted">
                        <tr>
                          <th className="border p-3 text-left">Type de livraison</th>
                          <th className="border p-3 text-left">Délai</th>
                          <th className="border p-3 text-left">Tarif</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-3">Standard</td>
                          <td className="border p-3">2-3 jours ouvrés</td>
                          <td className="border p-3">5,90 XAF</td>
                        </tr>
                        <tr>
                          <td className="border p-3">Express</td>
                          <td className="border p-3">24h (commande avant 14h)</td>
                          <td className="border p-3">9,90 XAF</td>
                        </tr>
                        <tr>
                          <td className="border p-3">Premium</td>
                          <td className="border p-3">Créneau 2h à choisir</td>
                          <td className="border p-3">14,90 XAF</td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <p className="text-sm text-muted-foreground">
                      Livraison gratuite dès 50XAF d'achat (Livraison Standard uniquement).
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Politique de retour</h3>
                    <p className="text-muted-foreground mb-2">
                      Nous offrons une garantie fraîcheur de 7 jours sur tous nos produits floraux. 
                      Si vous n'êtes pas satisfait de la qualité de nos fleurs à leur arrivée, 
                      veuillez nous contacter dans les 24 heures avec des photos.
                    </p>
                    <p className="text-muted-foreground">
                      Pour les articles non floraux, vous disposez d'un délai de 14 jours pour retourner les produits non utilisés 
                      dans leur emballage d'origine.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-24">
              <h2 className="text-2xl font-serif mb-8">Produits similaires</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
          
          {/* Recently Viewed Products */}
          {recentlyViewed.length > 0 && (
            <div className="mt-24">
              <h2 className="text-2xl font-serif mb-8">Récemment consultés</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentlyViewed.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
          
          {/* You may also like */}
          {popularProducts.length > 0 && (
            <div className="mt-24">
              <h2 className="text-2xl font-serif mb-8">Vous pourriez aussi aimer</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;