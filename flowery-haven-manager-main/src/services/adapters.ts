// src/services/adapters.ts
import { cartService } from './cart.service';
import { wishlistService } from './wishlist.service';
import { productService } from './product.service';
import { blogService } from './blog.service';
import { authService } from './auth.service';
import { quoteService } from './quote.service';
import { promotionService } from './promotion.service';
import { newsletterService } from './newsletter.service';
import { dashboardService } from './dashboard.service';
import { cmsService } from './cms.service';
import { ratingService } from './rating.service';
import { userManagementService } from './user-management.service';
import { addressService } from './address.service';
import { Product } from '@/types/product';
import { Category } from '@/types/category';

/**
 * Adaptateur pour le service de produits et catégories
 * Expose des méthodes pour interagir avec les produits et catégories de façon simplifiée
 */
export const dataAdapter = {
    // Méthodes pour obtenir des produits
    getAllProducts: async (): Promise<Product[]> => {
        try {
            return await productService.getAllProducts();
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    getProductById: async (id: string): Promise<Product | null> => {
        try {
            return await productService.getProductById(id);
        } catch (error) {
            console.error(`Error fetching product ${id}:`, error);
            return null;
        }
    },

    getProductsByCategory: async (categoryId: string): Promise<Product[]> => {
        try {
            return await productService.getProductsByCategory(categoryId);
        } catch (error) {
            console.error(`Error fetching products for category ${categoryId}:`, error);
            return [];
        }
    },

    getPopularProducts: async (): Promise<Product[]> => {
        try {
            return await productService.getPopularProducts();
        } catch (error) {
            console.error('Error fetching popular products:', error);
            return [];
        }
    },

    getFeaturedProducts: async (): Promise<Product[]> => {
        try {
            return await productService.getProducts({ featured: true });
        } catch (error) {
            console.error('Error fetching featured products:', error);
            return [];
        }
    },

    searchProducts: async (query: string): Promise<Product[]> => {
        try {
            const products = await productService.getAllProducts();
            const lowercaseQuery = query.toLowerCase();

            return products.filter(product =>
                product.name.toLowerCase().includes(lowercaseQuery) ||
                product.description.toLowerCase().includes(lowercaseQuery) ||
                (product.shortDescription && product.shortDescription.toLowerCase().includes(lowercaseQuery))
            );
        } catch (error) {
            console.error(`Error searching products with query "${query}":`, error);
            return [];
        }
    },

    // Méthodes pour manipuler des produits
    addProduct: async (product: Omit<Product, 'id'>): Promise<Product | null> => {
        try {
            return await productService.addProduct(product);
        } catch (error) {
            console.error('Error adding product:', error);
            return null;
        }
    },

    updateProduct: async (product: Product): Promise<Product | null> => {
        try {
            return await productService.updateProduct(product);
        } catch (error) {
            console.error(`Error updating product ${product.id}:`, error);
            return null;
        }
    },

    deleteProduct: async (id: string): Promise<boolean> => {
        try {
            return await productService.deleteProduct(id);
        } catch (error) {
            console.error(`Error deleting product ${id}:`, error);
            return false;
        }
    },

    // Méthodes pour les catégories
    getAllCategories: async (): Promise<Category[]> => {
        try {
            return await productService.getAllCategories();
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    getCategoryById: async (id: string): Promise<Category | null> => {
        try {
            const categories = await productService.getAllCategories();
            return categories.find(cat => cat.id === id) || null;
        } catch (error) {
            console.error(`Error fetching category ${id}:`, error);
            return null;
        }
    },

    addCategory: async (category: Category): Promise<Category | null> => {
        try {
            // Cette fonction devrait être implémentée dans le productService
            console.log('Adding category:', category);
            return category;
        } catch (error) {
            console.error('Error adding category:', error);
            return null;
        }
    },

    updateCategory: async (category: Category): Promise<Category | null> => {
        try {
            // Cette fonction devrait être implémentée dans le productService
            console.log('Updating category:', category);
            return category;
        } catch (error) {
            console.error(`Error updating category ${category.id}:`, error);
            return null;
        }
    },

    deleteCategory: async (id: string): Promise<boolean> => {
        try {
            // Cette fonction devrait être implémentée dans le productService
            console.log('Deleting category:', id);
            return true;
        } catch (error) {
            console.error(`Error deleting category ${id}:`, error);
            return false;
        }
    }
};
/**
 * Adaptateur pour le service de panier
 * Expose des méthodes pour interagir avec le panier de façon simplifiée
 */
export const cartAdapter = {
    getCart: async () => {
        try {
            return await cartService.getCart();
        } catch (error) {
            console.error('Error fetching cart:', error);
            return [];
        }
    },

    addToCart: async (productId: string, quantity: number = 1) => {
        try {
            await cartService.addToCart(productId, quantity);
            return true;
        } catch (error) {
            console.error(`Error adding product ${productId} to cart:`, error);
            return false;
        }
    },

    updateCartItem: async (cartItemId: string, quantity: number) => {
        try {
            await cartService.updateCartItemQuantity(cartItemId, quantity);
            return true;
        } catch (error) {
            console.error(`Error updating cart item ${cartItemId}:`, error);
            return false;
        }
    },

    updateCartItemQuantity: async (id: string, quantity: number) => {
        return cartAdapter.updateCartItem(id, quantity);
    },

    removeFromCart: async (id: string) => {
        try {
            await cartService.removeFromCart(id);
            return true;
        } catch (error) {
            console.error(`Error removing item ${id} from cart:`, error);
            return false;
        }
    },

    clearCart: async () => {
        try {
            await cartService.clearCart();
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            return false;
        }
    },

    getCartTotal: async () => {
        try {
            return await cartService.getCartTotal();
        } catch (error) {
            console.error('Error calculating cart total:', error);
            return 0;
        }
    },

    getCartItemCount: async () => {
        try {
            return await cartService.getCartItemCount();
        } catch (error) {
            console.error('Error calculating cart item count:', error);
            return 0;
        }
    }
};

/**
 * Adaptateur pour le service de liste de souhaits
 * Expose des méthodes pour interagir avec la liste de souhaits de façon simplifiée
 */
export const wishlistAdapter = {
    getWishlist: async () => {
        try {
            return await wishlistService.getWishlist();
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            return [];
        }
    },

    addToWishlist: async (item: any) => {
        try {
            await wishlistService.addToWishlist(item);
            return true;
        } catch (error) {
            console.error(`Error adding item to wishlist:`, error);
            return false;
        }
    },

    removeFromWishlist: async (id: string) => {
        try {
            await wishlistService.removeFromWishlist(id);
            return true;
        } catch (error) {
            console.error(`Error removing item ${id} from wishlist:`, error);
            return false;
        }
    },

    isInWishlist: async (id: string) => {
        try {
            return await wishlistService.isInWishlist(id);
        } catch (error) {
            console.error(`Error checking if item ${id} is in wishlist:`, error);
            return false;
        }
    },

    clearWishlist: async () => {
        try {
            await wishlistService.clearWishlist();
            return true;
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            return false;
        }
    },

    getWishlistCount: async () => {
        try {
            return await wishlistService.getWishlistCount();
        } catch (error) {
            console.error('Error calculating wishlist count:', error);
            return 0;
        }
    }
};

/**
 * Adaptateur pour le service de blog
 * Expose des méthodes pour interagir avec le blog de façon simplifiée
 */
export const blogAdapter = {
    getAllBlogPosts: async () => {
        try {
            return await blogService.getAllPosts();
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            return [];
        }
    },

    getBlogPosts: async () => {
        try {
            return await blogService.getAllPosts();
        } catch (error) {
            console.error('Error fetching blog posts:', error);
            return [];
        }
    },

    getBlogPostById: async (id: number) => {
        try {
            return await blogService.getPostById(id);
        } catch (error) {
            console.error(`Error fetching blog post ${id}:`, error);
            return null;
        }
    },

    getBlogPostsByCategory: async (category: string) => {
        try {
            return await blogService.getPostsByCategory(category);
        } catch (error) {
            console.error(`Error fetching blog posts for category ${category}:`, error);
            return [];
        }
    },

    getRecentBlogPosts: async (count: number = 3) => {
        try {
            return await blogService.getRecentPosts(count);
        } catch (error) {
            console.error('Error fetching recent blog posts:', error);
            return [];
        }
    },

    getPopularBlogPosts: async (count: number) => {
        try {
            return await blogService.getPopularPosts(count);
        } catch (error) {
            console.error('Error fetching popular blog posts:', error);
            return [];
        }
    },

    getFeaturedBlogPosts: async (count: number) => {
        try {
            return await blogService.getFeaturedPosts(count);
        } catch (error) {
            console.error('Error fetching featured blog posts:', error);
            return [];
        }
    },

    searchBlogPosts: async (query: string) => {
        try {
            return await blogService.searchPosts(query);
        } catch (error) {
            console.error(`Error searching blog posts with query "${query}":`, error);
            return [];
        }
    },

    getBlogPostsByTag: async (tag: string) => {
        try {
            return await blogService.getPostsByTag(tag);
        } catch (error) {
            console.error(`Error fetching blog posts for tag ${tag}:`, error);
            return [];
        }
    },

    getAllTags: async () => {
        try {
            return await blogService.getAllTags();
        } catch (error) {
            console.error('Error fetching all tags:', error);
            return [];
        }
    },

    sortBlogPosts: (posts: any[], sortBy: string) => {
        return blogService.sortPosts(posts, sortBy);
    },

    getCommentsForPost: async (postId: number) => {
        try {
            return await blogService.getCommentsForPost(postId);
        } catch (error) {
            console.error(`Error fetching comments for post ${postId}:`, error);
            return [];
        }
    },

    addCommentToPost: async (postId: number, author: string, content: string, parentId?: number, email?: string) => {
        try {
            return await blogService.addComment(postId, author, content, parentId, email);
        } catch (error) {
            console.error(`Error adding comment to post ${postId}:`, error);
            return null;
        }
    },

    addReactionToComment: async (postId: number, commentId: number, reactionType: string) => {
        try {
            return await blogService.addReactionToComment(postId, commentId, reactionType);
        } catch (error) {
            console.error(`Error adding reaction to comment ${commentId}:`, error);
            return false;
        }
    }
};

/**
 * Adaptateur pour le service d'authentification
 */
export const authAdapter = {
    register: async (userData: any) => {
        try {
            return await authService.register(userData);
        } catch (error) {
            console.error('Error registering user:', error);
            return null;
        }
    },

    login: async (email: string, password: string) => {
        try {
            return await authService.login(email, password);
        } catch (error) {
            console.error('Error logging in:', error);
            return null;
        }
    },

    logout: () => {
        try {
            authService.logout();
            return true;
        } catch (error) {
            console.error('Error logging out:', error);
            return false;
        }
    },

    isAuthenticated: () => {
        return authService.isAuthenticated();
    },

    getCurrentUser: () => {
        return authService.getCurrentUser();
    },

    isAdmin: () => {
        return authService.isAdmin();
    },

    requestPasswordReset: async (email: string) => {
        try {
            return await authService.requestPasswordReset(email);
        } catch (error) {
            console.error(`Error requesting password reset for ${email}:`, error);
            return false;
        }
    },

    resetPassword: async (token: string, newPassword: string) => {
        try {
            return await authService.resetPassword(token, newPassword);
        } catch (error) {
            console.error('Error resetting password:', error);
            return false;
        }
    },

    updateUserProfile: async (updates: any) => {
        try {
            return await authService.updateUserProfile(updates);
        } catch (error) {
            console.error('Error updating user profile:', error);
            return null;
        }
    },

    enableTwoFactorAuth: async (password: string) => {
        try {
            return await authService.enableTwoFactorAuth(password);
        } catch (error) {
            console.error('Error enabling two-factor authentication:', error);
            return null;
        }
    },

    confirmTwoFactorAuth: async (token: string) => {
        try {
            return await authService.confirmTwoFactorAuth(token);
        } catch (error) {
            console.error('Error confirming two-factor authentication:', error);
            return false;
        }
    },

    verifyTwoFactorToken: async (token: string) => {
        try {
            return await authService.verifyTwoFactorToken(token);
        } catch (error) {
            console.error('Error verifying two-factor token:', error);
            return false;
        }
    },

    disableTwoFactorAuth: async (password: string) => {
        try {
            return await authService.disableTwoFactorAuth(password);
        } catch (error) {
            console.error('Error disabling two-factor authentication:', error);
            return false;
        }
    }
};

/**
 * Adaptateur pour le service de devis
 */
export const quoteAdapter = {
    createQuoteRequest: async (description: string, files: any[], urgency: string, expectedDeliveryDate: Date, specialRequirements: string) => {
        try {
            return await quoteService.createQuoteRequest(description, files, urgency, expectedDeliveryDate, specialRequirements);
        } catch (error) {
            console.error('Error creating quote request:', error);
            return null;
        }
    },

    getUserQuoteRequests: async () => {
        try {
            return await quoteService.getUserQuoteRequests();
        } catch (error) {
            console.error('Error fetching user quote requests:', error);
            return [];
        }
    },

    getQuoteRequestById: async (requestId: string) => {
        try {
            return await quoteService.getQuoteRequestById(requestId);
        } catch (error) {
            console.error(`Error fetching quote request ${requestId}:`, error);
            return null;
        }
    },

    cancelQuoteRequest: async (requestId: string) => {
        try {
            return await quoteService.cancelQuoteRequest(requestId);
        } catch (error) {
            console.error(`Error canceling quote request ${requestId}:`, error);
            return false;
        }
    },

    getQuoteProposalsForRequest: async (requestId: string) => {
        try {
            return await quoteService.getQuoteProposalsForRequest(requestId);
        } catch (error) {
            console.error(`Error fetching quote proposals for request ${requestId}:`, error);
            return [];
        }
    },

    acceptQuoteProposal: async (proposalId: string, comment: string) => {
        try {
            return await quoteService.acceptQuoteProposal(proposalId, comment);
        } catch (error) {
            console.error(`Error accepting quote proposal ${proposalId}:`, error);
            return false;
        }
    },

    rejectQuoteProposal: async (proposalId: string, reason: string) => {
        try {
            return await quoteService.rejectQuoteProposal(proposalId, reason);
        } catch (error) {
            console.error(`Error rejecting quote proposal ${proposalId}:`, error);
            return false;
        }
    }
};

/**
 * Adaptateur pour le service de promotions
 */
export const promoAdapter = {
    getActivePromotions: async () => {
        try {
            return await promotionService.getActivePromotions();
        } catch (error) {
            console.error('Error fetching active promotions:', error);
            return [];
        }
    },

    validatePromoCode: async (code: string, cartTotal: number, categories: string[]) => {
        try {
            return await promotionService.validatePromoCode(code, cartTotal, categories);
        } catch (error) {
            console.error(`Error validating promo code ${code}:`, error);
            return null;
        }
    },

    applyPromoCode: async (code: string, cartTotal: number, shippingCost: number, categories: string[]) => {
        try {
            return await promotionService.applyPromoCode(code, cartTotal, shippingCost, categories);
        } catch (error) {
            console.error(`Error applying promo code ${code}:`, error);
            return null;
        }
    },

    markPromoCodeAsUsed: async (code: string) => {
        try {
            return await promotionService.markPromoCodeAsUsed(code);
        } catch (error) {
            console.error(`Error marking promo code ${code} as used:`, error);
            return false;
        }
    }
};
/**
 * Adaptateur pour le service de newsletter
 */
export const newsletterAdapter = {
    subscribe: async (email: string, firstName?: string, lastName?: string, preferences?: string[]) => {
        try {
            return await newsletterService.subscribe(email, firstName, lastName, preferences);
        } catch (error) {
            console.error(`Error subscribing ${email} to newsletter:`, error);
            return false;
        }
    },

    unsubscribe: async (tokenOrEmail: string) => {
        try {
            return await newsletterService.unsubscribe(tokenOrEmail);
        } catch (error) {
            console.error(`Error unsubscribing ${tokenOrEmail} from newsletter:`, error);
            return false;
        }
    },

    updatePreferences: async (tokenOrEmail: string, preferences: string[]) => {
        try {
            return await newsletterService.updatePreferences(tokenOrEmail, preferences);
        } catch (error) {
            console.error(`Error updating preferences for ${tokenOrEmail}:`, error);
            return false;
        }
    },

    isSubscribed: async (email: string) => {
        try {
            return await newsletterService.isSubscribed(email);
        } catch (error) {
            console.error(`Error checking if ${email} is subscribed:`, error);
            return false;
        }
    },

    getSubscriberPreferences: async (email: string) => {
        try {
            return await newsletterService.getSubscriberPreferences(email);
        } catch (error) {
            console.error(`Error getting preferences for ${email}:`, error);
            return null;
        }
    }
};

/**
 * Adaptateur pour le service de tableau de bord
 */
export const dashboardAdapter = {
    getDashboardSummary: async () => {
        try {
            return await dashboardService.getDashboardSummary();
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            return null;
        }
    },

    getSalesData: async (period: string, count: number) => {
        try {
            return await dashboardService.getSalesData(period, count);
        } catch (error) {
            console.error(`Error fetching sales data for ${period}:`, error);
            return [];
        }
    },

    getProductPerformance: async (sortBy: string, limit: number) => {
        try {
            return await dashboardService.getProductPerformance(sortBy, limit);
        } catch (error) {
            console.error('Error fetching product performance:', error);
            return [];
        }
    },

    getCategoryPerformance: async () => {
        try {
            return await dashboardService.getCategoryPerformance();
        } catch (error) {
            console.error('Error fetching category performance:', error);
            return [];
        }
    },

    getUserActivity: async () => {
        try {
            return await dashboardService.getUserActivity();
        } catch (error) {
            console.error('Error fetching user activity:', error);
            return [];
        }
    },

    getBlogStats: async () => {
        try {
            return await dashboardService.getBlogStats();
        } catch (error) {
            console.error('Error fetching blog stats:', error);
            return null;
        }
    },

    getOrderStats: async () => {
        try {
            return await dashboardService.getOrderStats();
        } catch (error) {
            console.error('Error fetching order stats:', error);
            return null;
        }
    },

    exportData: async (dataType: string, period: string, count: number) => {
        try {
            return await dashboardService.exportData(dataType, period, count);
        } catch (error) {
            console.error(`Error exporting ${dataType} data:`, error);
            return null;
        }
    }
};

/**
 * Adaptateur pour le service CMS
 */
export const cmsAdapter = {
    getAllPages: async (includeUnpublished?: boolean) => {
        try {
            return await cmsService.getAllPages(includeUnpublished);
        } catch (error) {
            console.error('Error fetching all pages:', error);
            return [];
        }
    },

    getPageBySlug: async (slug: string) => {
        try {
            return await cmsService.getPageBySlug(slug);
        } catch (error) {
            console.error(`Error fetching page with slug ${slug}:`, error);
            return null;
        }
    },

    getPageById: async (id: string) => {
        try {
            return await cmsService.getPageById(id);
        } catch (error) {
            console.error(`Error fetching page with id ${id}:`, error);
            return null;
        }
    },

    getAllComponents: async (activeOnly?: boolean) => {
        try {
            return await cmsService.getAllComponents(activeOnly);
        } catch (error) {
            console.error('Error fetching all components:', error);
            return [];
        }
    },

    getAllTemplates: async (activeOnly?: boolean) => {
        try {
            return await cmsService.getAllTemplates(activeOnly);
        } catch (error) {
            console.error('Error fetching all templates:', error);
            return [];
        }
    }
};
/**
 * Adaptateur pour le service de notation
 */
export const ratingAdapter = {
    getProductReviews: async (
        productId: string,
        sortBy?: string,
        filterBy?: string,
        minRating?: number,
        maxRating?: number
    ) => {
        try {
            return await ratingService.getProductReviews(productId, sortBy, filterBy, minRating, maxRating);
        } catch (error) {
            console.error(`Error fetching reviews for product ${productId}:`, error);
            return [];
        }
    },

    getProductReviewsSummary: async (productId: string) => {
        try {
            return await ratingService.getProductReviewsSummary(productId);
        } catch (error) {
            console.error(`Error fetching review summary for product ${productId}:`, error);
            return null;
        }
    },

    createReview: async (productId: string, title: string, content: string, rating: number, images?: string[]) => {
        try {
            return await ratingService.createReview(productId, title, content, rating, images);
        } catch (error) {
            console.error(`Error creating review for product ${productId}:`, error);
            return null;
        }
    },

    updateReview: async (reviewId: string, updates: any) => {
        try {
            return await ratingService.updateReview(reviewId, updates);
        } catch (error) {
            console.error(`Error updating review ${reviewId}:`, error);
            return null;
        }
    },

    deleteReview: async (reviewId: string) => {
        try {
            return await ratingService.deleteReview(reviewId);
        } catch (error) {
            console.error(`Error deleting review ${reviewId}:`, error);
            return false;
        }
    },

    voteReview: async (reviewId: string, isHelpful: boolean) => {
        try {
            return await ratingService.voteReview(reviewId, isHelpful);
        } catch (error) {
            console.error(`Error voting for review ${reviewId}:`, error);
            return false;
        }
    },

    removeVote: async (reviewId: string) => {
        try {
            return await ratingService.removeVote(reviewId);
        } catch (error) {
            console.error(`Error removing vote for review ${reviewId}:`, error);
            return false;
        }
    },

    canUserReviewProduct: async (productId: string) => {
        try {
            return await ratingService.canUserReviewProduct(productId);
        } catch (error) {
            console.error(`Error checking if user can review product ${productId}:`, error);
            return false;
        }
    },

    getUserReviews: async (userId: string) => {
        try {
            return await ratingService.getUserReviews(userId);
        } catch (error) {
            console.error(`Error fetching reviews by user ${userId}:`, error);
            return [];
        }
    }
};

/**
 * Adaptateur pour le service de gestion des utilisateurs
 */
export const userAdapter = {
    getAllUsers: async () => {
        try {
            return await userManagementService.getAllUsers();
        } catch (error) {
            console.error('Error fetching all users:', error);
            return [];
        }
    },

    getUserActivityHistory: async (userId: string) => {
        try {
            return await userManagementService.getUserActivityHistory(userId);
        } catch (error) {
            console.error(`Error fetching activity history for user ${userId}:`, error);
            return [];
        }
    },

    getAllRoles: async () => {
        try {
            return await userManagementService.getAllRoles();
        } catch (error) {
            console.error('Error fetching all roles:', error);
            return [];
        }
    },

    getAllPermissions: async () => {
        try {
            return await userManagementService.getAllPermissions();
        } catch (error) {
            console.error('Error fetching all permissions:', error);
            return [];
        }
    }
};

/**
 * Adaptateur pour le service d'adresses
 */
export const addressAdapter = {
    getUserAddresses: async () => {
        try {
            return await addressService.getUserAddresses();
        } catch (error) {
            console.error('Error fetching user addresses:', error);
            return [];
        }
    },

    getAddressesByType: async (type: "shipping" | "billing") => {
        try {
            return await addressService.getAddressesByType(type);
        } catch (error) {
            console.error(`Error fetching ${type} addresses:`, error);
            return [];
        }
    },

    getDefaultAddress: async (type: "shipping" | "billing") => {
        try {
            return await addressService.getDefaultAddress(type);
        } catch (error) {
            console.error(`Error fetching default ${type} address:`, error);
            return null;
        }
    },

    addAddress: async (addressData: any) => {
        try {
            return await addressService.addAddress(addressData);
        } catch (error) {
            console.error('Error adding address:', error);
            return null;
        }
    },

    updateAddress: async (addressId: string, addressData: any) => {
        try {
            return await addressService.updateAddress(addressId, addressData);
        } catch (error) {
            console.error(`Error updating address ${addressId}:`, error);
            return null;
        }
    },

    deleteAddress: async (addressId: string) => {
        try {
            return await addressService.deleteAddress(addressId);
        } catch (error) {
            console.error(`Error deleting address ${addressId}:`, error);
            return false;
        }
    },

    setDefaultAddress: async (addressId: string) => {
        try {
            return await addressService.setDefaultAddress(addressId);
        } catch (error) {
            console.error(`Error setting address ${addressId} as default:`, error);
            return false;
        }
    }
};
