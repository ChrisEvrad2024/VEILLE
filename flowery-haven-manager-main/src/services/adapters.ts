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

// Adaptateur pour lib/cart.ts
export const cartAdapter = {
    getCart: async () => {
        const cartItems = await cartService.getCart();
        return cartItems.map(item => ({
            product: item.product,
            quantity: item.quantity
        }));
    },
    addToCart: async (product, quantity = 1) => {
        return await cartService.addToCart(product.id, quantity);
    },
    updateCartItemQuantity: async (productId, quantity) => {
        return await cartService.updateCartItemQuantity(productId, quantity);
    },
    removeFromCart: async (productId) => {
        return await cartService.removeFromCart(productId);
    },
    clearCart: async () => {
        return await cartService.clearCart();
    },
    getCartTotal: async () => {
        return await cartService.getCartTotal();
    },
    getCartItemCount: async () => {
        return await cartService.getCartItemCount();
    }
};

// Adaptateur pour lib/wishlist.ts
export const wishlistAdapter = {
    getWishlist: async () => {
        return await wishlistService.getWishlist();
    },
    addToWishlist: async (item) => {
        return await wishlistService.addToWishlist(item);
    },
    removeFromWishlist: async (id) => {
        return await wishlistService.removeFromWishlist(id);
    },
    isInWishlist: async (id) => {
        return await wishlistService.isInWishlist(id);
    },
    clearWishlist: async () => {
        return await wishlistService.clearWishlist();
    },
    getWishlistCount: async () => {
        return await wishlistService.getWishlistCount();
    }
};

// Adaptateur pour lib/data.ts
export const dataAdapter = {
    getProductById: async (id) => {
        return await productService.getProductById(id);
    },
    getPopularProducts: async () => {
        return await productService.getPopularProducts();
    },
    getFeaturedProducts: async () => {
        return await productService.getProducts({ featured: true });
    },
    getProductsByCategory: async (categoryId) => {
        return await productService.getProductsByCategory(categoryId);
    },
    getAllProducts: async () => {
        return await productService.getAllProducts();
    },
    getAllCategories: async () => {
        return await productService.getAllCategories();
    },
    addProduct: async (product) => {
        return await productService.addProduct(product);
    },
    updateProduct: async (product) => {
        return await productService.updateProduct(product);
    },
    deleteProduct: async (productId) => {
        return await productService.deleteProduct(productId);
    }
};

// Adaptateur pour lib/blog.ts
export const blogAdapter = {
    getAllBlogPosts: async () => {
        return await blogService.getAllPosts();
    },
    getBlogPostById: async (id) => {
        return await blogService.getPostById(id);
    },
    getBlogPostsByCategory: async (category) => {
        return await blogService.getPostsByCategory(category);
    },
    getRecentBlogPosts: async (count) => {
        return await blogService.getRecentPosts(count);
    },
    getPopularBlogPosts: async (count) => {
        return await blogService.getPopularPosts(count);
    },
    getFeaturedBlogPosts: async (count) => {
        return await blogService.getFeaturedPosts(count);
    },
    searchBlogPosts: async (query) => {
        return await blogService.searchPosts(query);
    },
    getBlogPostsByTag: async (tag) => {
        return await blogService.getPostsByTag(tag);
    },
    getAllTags: async () => {
        return await blogService.getAllTags();
    },
    sortBlogPosts: (posts, sortBy) => {
        return blogService.sortPosts(posts, sortBy);
    },
    getCommentsForPost: async (postId) => {
        return await blogService.getCommentsForPost(postId);
    },
    addCommentToPost: async (postId, author, content, parentId, email) => {
        return await blogService.addComment(postId, author, content, parentId, email);
    },
    addReactionToComment: async (postId, commentId, reactionType) => {
        return await blogService.addReactionToComment(postId, commentId, reactionType);
    }
};

// Adaptateur pour lib/auth.ts
export const authAdapter = {
    register: async (userData) => {
        return await authService.register(userData);
    },
    login: async (email, password) => {
        return await authService.login(email, password);
    },
    logout: () => {
        authService.logout();
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
    requestPasswordReset: async (email) => {
        return await authService.requestPasswordReset(email);
    },
    resetPassword: async (token, newPassword) => {
        return await authService.resetPassword(token, newPassword);
    },
    updateUserProfile: async (updates) => {
        return await authService.updateUserProfile(updates);
    },
    enableTwoFactorAuth: async (password) => {
        return await authService.enableTwoFactorAuth(password);
    },
    confirmTwoFactorAuth: async (token) => {
        return await authService.confirmTwoFactorAuth(token);
    },
    verifyTwoFactorToken: async (token) => {
        return await authService.verifyTwoFactorToken(token);
    },
    disableTwoFactorAuth: async (password) => {
        return await authService.disableTwoFactorAuth(password);
    }
};

// Adaptateur pour lib/quote.ts
export const quoteAdapter = {
    createQuoteRequest: async (description, files, urgency, expectedDeliveryDate, specialRequirements) => {
        return await quoteService.createQuoteRequest(description, files, urgency, expectedDeliveryDate, specialRequirements);
    },
    getUserQuoteRequests: async () => {
        return await quoteService.getUserQuoteRequests();
    },
    getQuoteRequestById: async (requestId) => {
        return await quoteService.getQuoteRequestById(requestId);
    },
    cancelQuoteRequest: async (requestId) => {
        return await quoteService.cancelQuoteRequest(requestId);
    },
    getQuoteProposalsForRequest: async (requestId) => {
        return await quoteService.getQuoteProposalsForRequest(requestId);
    },
    acceptQuoteProposal: async (proposalId, comment) => {
        return await quoteService.acceptQuoteProposal(proposalId, comment);
    },
    rejectQuoteProposal: async (proposalId, reason) => {
        return await quoteService.rejectQuoteProposal(proposalId, reason);
    }
};

// Adaptateur pour lib/promotion.ts
export const promoAdapter = {
    getActivePromotions: async () => {
        return await promotionService.getActivePromotions();
    },
    validatePromoCode: async (code, cartTotal, categories) => {
        return await promotionService.validatePromoCode(code, cartTotal, categories);
    },
    applyPromoCode: async (code, cartTotal, shippingCost, categories) => {
        return await promotionService.applyPromoCode(code, cartTotal, shippingCost, categories);
    },
    markPromoCodeAsUsed: async (code) => {
        return await promotionService.markPromoCodeAsUsed(code);
    }
};

// Adaptateur pour lib/newsletter.ts
export const newsletterAdapter = {
    subscribe: async (email, firstName, lastName, preferences) => {
        return await newsletterService.subscribe(email, firstName, lastName, preferences);
    },
    unsubscribe: async (tokenOrEmail) => {
        return await newsletterService.unsubscribe(tokenOrEmail);
    },
    updatePreferences: async (tokenOrEmail, preferences) => {
        return await newsletterService.updatePreferences(tokenOrEmail, preferences);
    },
    isSubscribed: async (email) => {
        return await newsletterService.isSubscribed(email);
    },
    getSubscriberPreferences: async (email) => {
        return await newsletterService.getSubscriberPreferences(email);
    }
};

// Adaptateur pour lib/dashboard.ts
export const dashboardAdapter = {
    getDashboardSummary: async () => {
        return await dashboardService.getDashboardSummary();
    },
    getSalesData: async (period, count) => {
        return await dashboardService.getSalesData(period, count);
    },
    getProductPerformance: async (sortBy, limit) => {
        return await dashboardService.getProductPerformance(sortBy, limit);
    },
    getCategoryPerformance: async () => {
        return await dashboardService.getCategoryPerformance();
    },
    getUserActivity: async () => {
        return await dashboardService.getUserActivity();
    },
    getBlogStats: async () => {
        return await dashboardService.getBlogStats();
    },
    getOrderStats: async () => {
        return await dashboardService.getOrderStats();
    },
    exportData: async (dataType, period, count) => {
        return await dashboardService.exportData(dataType, period, count);
    }
};

// Adaptateur pour lib/cms.ts
export const cmsAdapter = {
    getAllPages: async (includeUnpublished) => {
        return await cmsService.getAllPages(includeUnpublished);
    },
    getPageBySlug: async (slug) => {
        return await cmsService.getPageBySlug(slug);
    },
    getPageById: async (id) => {
        return await cmsService.getPageById(id);
    },
    getAllComponents: async (activeOnly) => {
        return await cmsService.getAllComponents(activeOnly);
    },
    getAllTemplates: async (activeOnly) => {
        return await cmsService.getAllTemplates(activeOnly);
    }
};

// Adaptateur pour lib/rating.ts
export const ratingAdapter = {
    getProductReviews: async (productId, sortBy, filterBy, minRating, maxRating) => {
        return await ratingService.getProductReviews(productId, sortBy, filterBy, minRating, maxRating);
    },
    getProductReviewsSummary: async (productId) => {
        return await ratingService.getProductReviewsSummary(productId);
    },
    createReview: async (productId, title, content, rating, images) => {
        return await ratingService.createReview(productId, title, content, rating, images);
    },
    updateReview: async (reviewId, updates) => {
        return await ratingService.updateReview(reviewId, updates);
    },
    deleteReview: async (reviewId) => {
        return await ratingService.deleteReview(reviewId);
    },
    voteReview: async (reviewId, isHelpful) => {
        return await ratingService.voteReview(reviewId, isHelpful);
    },
    removeVote: async (reviewId) => {
        return await ratingService.removeVote(reviewId);
    },
    canUserReviewProduct: async (productId) => {
        return await ratingService.canUserReviewProduct(productId);
    },
    getUserReviews: async (userId) => {
        return await ratingService.getUserReviews(userId);
    }
};

// Adaptateur pour lib/user.ts
export const userAdapter = {
    getAllUsers: async () => {
        return await userManagementService.getAllUsers();
    },
    getUserActivityHistory: async (userId) => {
        return await userManagementService.getUserActivityHistory(userId);
    },
    getAllRoles: async () => {
        return await userManagementService.getAllRoles();
    },
    getAllPermissions: async () => {
        return await userManagementService.getAllPermissions();
    }
};