import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Heart,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import { wishlistAdapter } from "@/services/adapters";
import { cartAdapter } from "@/services/adapters";

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingProductIds, setProcessingProductIds] = useState<string[]>(
    []
  );

  // Load wishlist on mount and when it changes
  useEffect(() => {
    loadWishlist();

    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      console.log("Événement wishlistUpdated détecté");
      loadWishlist();
    };

    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    window.addEventListener("storage", handleWishlistUpdate);

    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
      window.removeEventListener("storage", handleWishlistUpdate);
    };
  }, []);

  const loadWishlist = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Chargement de la wishlist...");
      const items = await wishlistAdapter.getWishlist();
      console.log("Wishlist chargée:", items.length, "éléments", items);
      setWishlistItems(items);
    } catch (error) {
      console.error("Erreur chargement wishlist:", error);
      setError(
        "Impossible de charger votre liste de favoris. Veuillez réessayer."
      );
      toast.error("Erreur lors du chargement de la liste de souhaits");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWishlist();
    setIsRefreshing(false);
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    // Prevent multiple clicks
    if (processingProductIds.includes(productId)) return;

    setProcessingProductIds((prev) => [...prev, productId]);

    try {
      console.log("Tentative de suppression:", productId);
      const result = await wishlistAdapter.removeFromWishlist(productId);

      if (result.success) {
        toast.success("Produit retiré de vos favoris");

        // Update state to remove the item immediately
        setWishlistItems((prevItems) =>
          prevItems.filter(
            (item) => item.id !== productId && item.productId !== productId
          )
        );
      } else {
        throw new Error(result.error || "Échec de suppression");
      }
    } catch (error) {
      console.error("Erreur suppression wishlist:", error);
      toast.error("Erreur lors de la suppression");

      // Reload the wishlist to ensure consistent state
      loadWishlist();
    } finally {
      setProcessingProductIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleAddToCart = async (product: any) => {
    // Prevent multiple clicks
    if (processingProductIds.includes(product.id)) return;

    setProcessingProductIds((prev) => [...prev, product.id]);

    try {
      console.log("Ajout au panier (original):", product);

      // S'assurer que le produit a une structure complète
      const formattedProduct = {
        ...product,
        id: product.productId || product.id,
        productId: product.productId || product.id,
        price:
          typeof product.price === "number"
            ? product.price
            : parseFloat(product.price) || 0,
        image: product.image || "/assets/placeholder.png",
        images: product.images || [product.image || "/assets/placeholder.png"],
        quantity: 1,
      };

      console.log("Produit formaté pour le panier:", formattedProduct);

      // Use the cart adapter with formatted data
      const result = await cartAdapter.addToCart(formattedProduct);

      if (result.success) {
        toast.success("Produit ajouté au panier", {
          description: product.name,
        });
      } else {
        throw new Error(result.error || "Échec d'ajout au panier");
      }
    } catch (error) {
      console.error("Erreur ajout panier:", error);
      toast.error("Erreur lors de l'ajout au panier");
    } finally {
      setProcessingProductIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  // Helper function to format price display
  const formatPrice = (price: any) => {
    if (typeof price === "number") {
      return `${price.toFixed(2)} XAF`;
    } else if (typeof price === "string" && !isNaN(parseFloat(price))) {
      return `${parseFloat(price).toFixed(2)} XAF`;
    }
    return "Prix indisponible";
  };

  return (
    <>
      <Navbar />
      <main className="container max-w-7xl mx-auto px-4 py-32 min-h-screen">
        <div className="mb-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <Button
              variant="ghost"
              asChild
              className="p-0 h-auto hover:bg-transparent hover:underline"
            >
              <Link to="/">
                <ArrowLeft size={16} className="mr-1" />
                Retour à l'accueil
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin" : ""}
              />
              Actualiser
            </Button>
          </div>

          <h1 className="text-3xl font-serif mt-4 mb-2">Mes favoris</h1>
          <p className="text-muted-foreground">
            Votre liste de produits favoris, à ajouter au panier quand vous le
            souhaitez.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin w-12 h-12 border-b-2 border-primary rounded-full mb-4"></div>
            <p className="text-muted-foreground">
              Chargement de vos favoris...
            </p>
          </div>
        ) : wishlistItems.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <Heart size={40} className="text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">
                Votre liste de favoris est vide
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg">
                Vous n'avez pas encore ajouté de produits à vos favoris.
                Parcourez notre boutique et ajoutez des produits à votre liste
                en cliquant sur l'icône en forme de cœur.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link to="/catalog">
                    <ShoppingCart size={16} className="mr-2" />
                    Découvrir nos produits
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    size={16}
                    className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4">Produit</th>
                    <th className="text-right p-4">Prix</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {wishlistItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            {/* Fallback for data:image */}
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log(
                                  "Image error, fallback to placeholder"
                                );
                                (e.target as HTMLImageElement).src =
                                  "/assets/placeholder.png";
                              }}
                            />
                          </div>
                          <div>
                            <Link
                              to={`/product/${item.id}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {item.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-medium">
                          {formatPrice(item.price)}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                            disabled={processingProductIds.includes(item.id)}
                          >
                            <ShoppingBag size={16} className="mr-2" />
                            {processingProductIds.includes(item.id)
                              ? "En cours..."
                              : "Ajouter au panier"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFromWishlist(item.id)}
                            disabled={processingProductIds.includes(item.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {wishlistItems.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <Button variant="outline" asChild>
                  <Link to="/catalog">Continuer vos achats</Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      const result = await wishlistAdapter.clearWishlist();
                      if (result.success) {
                        setWishlistItems([]);
                        toast.success("Liste de favoris vidée");
                      } else {
                        throw new Error(result.error || "Échec de vidage");
                      }
                    } catch (error) {
                      console.error("Erreur vidage wishlist:", error);
                      toast.error("Erreur lors de la suppression");
                      loadWishlist();
                    }
                  }}
                >
                  <Trash2 size={16} className="mr-2" />
                  Vider la liste
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Wishlist;
