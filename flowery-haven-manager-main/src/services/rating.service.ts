// src/services/rating.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';
import { orderService } from './order.service';

// Types pour les avis et notes
export interface ProductReview {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    title: string;
    content: string;
    rating: number; // 1 à 5
    isVerifiedPurchase: boolean;
    images?: string[];
    createdAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    helpful: number; // Nombre de votes utiles
    notHelpful: number; // Nombre de votes non utiles
    adminResponse?: {
        content: string;
        createdAt: Date;
        updatedAt?: Date;
    };
    updatedAt?: Date;
}

export interface ReviewVote {
    id: string;
    reviewId: string;
    userId: string;
    isHelpful: boolean;
    timestamp: Date;
}

// Créer un avis sur un produit
const createReview = async (
    productId: string,
    title: string,
    content: string,
    rating: number,
    images: string[] = []
): Promise<ProductReview> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Valider la note
        if (rating < 1 || rating > 5) {
            throw new Error("La note doit être comprise entre 1 et 5");
        }

        // Vérifier si l'utilisateur a déjà laissé un avis sur ce produit
        const existingReviews = await dbService.getAllItems<ProductReview>("productReviews");
        const userReview = existingReviews.find(
            review => review.productId === productId && review.userId === currentUser.id
        );

        if (userReview) {
            throw new Error("Vous avez déjà laissé un avis sur ce produit");
        }

        // Vérifier si l'utilisateur a acheté le produit
        const orders = await orderService.getUserOrders();
        const isVerifiedPurchase = orders.some(order => 
            order.orderItems.some(item => item.productId === productId)
        );

        // Créer l'avis
        const newReview: ProductReview = {
            id: `review_${Date.now()}`,
            productId,
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName.charAt(0)}.`, // Format: Prénom N.
            title,
            content,
            rating,
            isVerifiedPurchase,
            images,
            createdAt: new Date(),
            status: authService.isAdmin() ? 'approved' : 'pending', // Auto-approuvé pour les admins
            helpful: 0,
            notHelpful: 0
        };

        await dbService.addItem("productReviews", newReview);

        return newReview;
    } catch (error) {
        console.error(`Error in createReview for product ${productId}:`, error);
        throw error;
    }
};

// Modifier un avis (utilisateur)
const updateReview = async (
    reviewId: string,
    updates: {
        title?: string;
        content?: string;
        rating?: number;
        images?: string[];
    }
): Promise<ProductReview> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const review = await dbService.getItemById<ProductReview>("productReviews", reviewId);

        if (!review) {
            throw new Error("Avis non trouvé");
        }

        // Vérifier que l'utilisateur est le propriétaire
        if (review.userId !== currentUser.id && !authService.isAdmin()) {
            throw new Error("Vous n'êtes pas autorisé à modifier cet avis");
        }

        // Valider la note si elle est modifiée
        if (updates.rating && (updates.rating < 1 || updates.rating > 5)) {
            throw new Error("La note doit être comprise entre 1 et 5");
        }

        // Préparer les mises à jour
        const updatedReview: ProductReview = {
            ...review,
            title: updates.title || review.title,
            content: updates.content || review.content,
            rating: updates.rating || review.rating,
            images: updates.images || review.images,
            updatedAt: new Date(),
            status: authService.isAdmin() ? review.status : 'pending' // Retour à "pending" si modifié par l'utilisateur
        };

        await dbService.updateItem("productReviews", updatedReview);

        return updatedReview;
    } catch (error) {
        console.error(`Error in updateReview for review ${reviewId}:`, error);
        throw error;
    }
};

// Supprimer un avis
const deleteReview = async (reviewId: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const review = await dbService.getItemById<ProductReview>("productReviews", reviewId);

        if (!review) {
            return false;
        }

        // Vérifier que l'utilisateur est le propriétaire ou un admin
        if (review.userId !== currentUser.id && !authService.isAdmin()) {
            throw new Error("Vous n'êtes pas autorisé à supprimer cet avis");
        }

        // Supprimer l'avis
        await dbService.deleteItem("productReviews", reviewId);

        // Supprimer également les votes associés
        const allVotes = await dbService.getAllItems<ReviewVote>("reviewVotes");
        const reviewVotes = allVotes.filter(vote => vote.reviewId === reviewId);

        for (const vote of reviewVotes) {
            await dbService.deleteItem("reviewVotes", vote.id);
        }

        return true;
    } catch (error) {
        console.error(`Error in deleteReview for review ${reviewId}:`, error);
        return false;
    }
};

// Obtenir les avis pour un produit (public)
const getProductReviews = async (
    productId: string,
    sortBy: 'recent' | 'helpful' | 'rating_high' | 'rating_low' = 'recent',
    filterBy?: 'verified' | 'with_images' | 'with_admin_response',
    minRating?: number,
    maxRating?: number
): Promise<ProductReview[]> => {
    try {
        // Récupérer tous les avis approuvés pour ce produit
        const allReviews = await dbService.getAllItems<ProductReview>("productReviews");
        let reviews = allReviews.filter(
            review => review.productId === productId && review.status === 'approved'
        );

        // Appliquer les filtres optionnels
        if (filterBy === 'verified') {
            reviews = reviews.filter(review => review.isVerifiedPurchase);
        } else if (filterBy === 'with_images') {
            reviews = reviews.filter(review => review.images && review.images.length > 0);
        } else if (filterBy === 'with_admin_response') {
            reviews = reviews.filter(review => review.adminResponse !== undefined);
        }

        if (minRating !== undefined) {
            reviews = reviews.filter(review => review.rating >= minRating);
        }

        if (maxRating !== undefined) {
            reviews = reviews.filter(review => review.rating <= maxRating);
        }

        // Trier les avis
        switch (sortBy) {
            case 'recent':
                reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'helpful':
                reviews.sort((a, b) => b.helpful - a.helpful);
                break;
            case 'rating_high':
                reviews.sort((a, b) => b.rating - a.rating);
                break;
            case 'rating_low':
                reviews.sort((a, b) => a.rating - b.rating);
                break;
        }

        return reviews;
    } catch (error) {
        console.error(`Error in getProductReviews for product ${productId}:`, error);
        return [];
    }
};

// Obtenir un résumé des avis pour un produit (public)
const getProductReviewsSummary = async (
    productId: string
): Promise<{
    averageRating: number;
    totalReviews: number;
    verifiedReviews: number;
    ratingDistribution: Record<string, number>;
}> => {
    try {
        // Récupérer tous les avis approuvés pour ce produit
        const allReviews = await dbService.getAllItems<ProductReview>("productReviews");
        const reviews = allReviews.filter(
            review => review.productId === productId && review.status === 'approved'
        );

        // Calculer la note moyenne
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        // Compter les avis vérifiés
        const verifiedReviews = reviews.filter(review => review.isVerifiedPurchase).length;

        // Calculer la distribution des notes
        const ratingDistribution: Record<string, number> = {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
        };

        for (const review of reviews) {
            ratingDistribution[review.rating.toString()]++;
        }

        return {
            averageRating,
            totalReviews: reviews.length,
            verifiedReviews,
            ratingDistribution
        };
    } catch (error) {
        console.error(`Error in getProductReviewsSummary for product ${productId}:`, error);
        return {
            averageRating: 0,
            totalReviews: 0,
            verifiedReviews: 0,
            ratingDistribution: {
                '1': 0,
                '2': 0,
                '3': 0,
                '4': 0,
                '5': 0
            }
        };
    }
};

// Voter pour un avis (utile / pas utile)
const voteReview = async (
    reviewId: string,
    isHelpful: boolean
): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const review = await dbService.getItemById<ProductReview>("productReviews", reviewId);

        if (!review) {
            throw new Error("Avis non trouvé");
        }

        // Vérifier si l'utilisateur a déjà voté pour cet avis
        const allVotes = await dbService.getAllItems<ReviewVote>("reviewVotes");
        const existingVote = allVotes.find(
            vote => vote.reviewId === reviewId && vote.userId === currentUser.id
        );

        if (existingVote) {
            // Mettre à jour le vote existant si nécessaire
            if (existingVote.isHelpful !== isHelpful) {
                // Changer le vote
                const updatedVote: ReviewVote = {
                    ...existingVote,
                    isHelpful,
                    timestamp: new Date()
                };

                await dbService.updateItem("reviewVotes", updatedVote);

                // Mettre à jour les compteurs
                if (isHelpful) {
                    review.helpful++;
                    review.notHelpful--;
                } else {
                    review.helpful--;
                    review.notHelpful++;
                }

                await dbService.updateItem("productReviews", review);
            }

            return true;
        }

        // Créer un nouveau vote
        const newVote: ReviewVote = {
            id: `vote_${Date.now()}`,
            reviewId,
            userId: currentUser.id,
            isHelpful,
            timestamp: new Date()
        };

        await dbService.addItem("reviewVotes", newVote);

        // Mettre à jour les compteurs
        if (isHelpful) {
            review.helpful++;
        } else {
            review.notHelpful++;
        }

        await dbService.updateItem("productReviews", review);

        return true;
    } catch (error) {
        console.error(`Error in voteReview for review ${reviewId}:`, error);
        return false;
    }
};

// Retirer un vote
const removeVote = async (reviewId: string): Promise<boolean> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        const review = await dbService.getItemById<ProductReview>("productReviews", reviewId);

        if (!review) {
            throw new Error("Avis non trouvé");
        }

        // Trouver le vote existant
        const allVotes = await dbService.getAllItems<ReviewVote>("reviewVotes");
        const existingVote = allVotes.find(
            vote => vote.reviewId === reviewId && vote.userId === currentUser.id
        );

        if (!existingVote) {
            return false; // Pas de vote à retirer
        }

        // Supprimer le vote
        await dbService.deleteItem("reviewVotes", existingVote.id);

        // Mettre à jour les compteurs
        if (existingVote.isHelpful) {
            review.helpful = Math.max(0, review.helpful - 1);
        } else {
            review.notHelpful = Math.max(0, review.notHelpful - 1);
        }

        await dbService.updateItem("productReviews", review);

        return true;
    } catch (error) {
        console.error(`Error in removeVote for review ${reviewId}:`, error);
        return false;
    }
};

// Vérifier si l'utilisateur actuel est éligible pour laisser un avis
const canUserReviewProduct = async (productId: string): Promise<{
    canReview: boolean;
    reason?: string;
}> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            return {
                canReview: false,
                reason: "Vous devez être connecté pour laisser un avis."
            };
        }

        // Vérifier si l'utilisateur a déjà laissé un avis
        const allReviews = await dbService.getAllItems<ProductReview>("productReviews");
        const userReview = allReviews.find(
            review => review.productId === productId && review.userId === currentUser.id
        );

        if (userReview) {
            return {
                canReview: false,
                reason: "Vous avez déjà laissé un avis sur ce produit."
            };
        }

        // Vérifier si l'utilisateur a acheté le produit
        const orders = await orderService.getUserOrders();
        const hasPurchased = orders.some(order => 
            order.orderItems.some(item => item.productId === productId) &&
            ['delivered', 'shipped'].includes(order.status)
        );

        if (!hasPurchased && !authService.isAdmin()) {
            return {
                canReview: false,
                reason: "Vous devez avoir acheté ce produit pour laisser un avis."
            };
        }

        return {
            canReview: true
        };
    } catch (error) {
        console.error(`Error in canUserReviewProduct for product ${productId}:`, error);
        return {
            canReview: false,
            reason: "Une erreur est survenue lors de la vérification."
        };
    }
};

// ===== FONCTIONS ADMIN =====

// Obtenir tous les avis en attente (admin uniquement)
const getPendingReviews = async (): Promise<ProductReview[]> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const allReviews = await dbService.getAllItems<ProductReview>("productReviews");
        return allReviews
            .filter(review => review.status === 'pending')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
        console.error("Error in getPendingReviews:", error);
        return [];
    }
};

// Approuver un avis (admin uniquement)
const approveReview = async (reviewId: string): Promise<ProductReview> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const review = await dbService.getItemById<ProductReview>("productReviews", reviewId);

        if (!review) {
            throw new Error("Avis non trouvé");
        }

        // Mettre à jour le statut
        const updatedReview: ProductReview = {
            ...review,
            status: 'approved',
            updatedAt: new Date()
        };

        await dbService.updateItem("productReviews", updatedReview);

        return updatedReview;
    } catch (error) {
        console.error(`Error in approveReview for review ${reviewId}:`, error);
        throw error;
    }
};

// Rejeter un avis (admin uniquement)
const rejectReview = async (
    reviewId: string,
    rejectionReason: string
): Promise<ProductReview> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const review = await dbService.getItemById<ProductReview>("productReviews", reviewId);

        if (!review) {
            throw new Error("Avis non trouvé");
        }

        // Mettre à jour le statut
        const updatedReview: ProductReview = {
            ...review,
            status: 'rejected',
            rejectionReason,
            updatedAt: new Date()
        };

        await dbService.updateItem("productReviews", updatedReview);

        return updatedReview;
    } catch (error) {
        console.error(`Error in rejectReview for review ${reviewId}:`, error);
        throw error;
    }
};

// Ajouter une réponse de l'administrateur à un avis (admin uniquement)
const addAdminResponse = async (
    reviewId: string,
    content: string
): Promise<ProductReview> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const review = await dbService.getItemById<ProductReview>("productReviews", reviewId);

        if (!review) {
            throw new Error("Avis non trouvé");
        }

        const now = new Date();

        // Ajouter ou mettre à jour la réponse
        const updatedReview: ProductReview = {
            ...review,
            adminResponse: {
                content,
                createdAt: review.adminResponse ? review.adminResponse.createdAt : now,
                updatedAt: review.adminResponse ? now : undefined
            },
            updatedAt: now
        };

        await dbService.updateItem("productReviews", updatedReview);

        return updatedReview;
    } catch (error) {
        console.error(`Error in addAdminResponse for review ${reviewId}:`, error);
        throw error;
    }
};

// Supprimer une réponse de l'administrateur (admin uniquement)
const removeAdminResponse = async (reviewId: string): Promise<ProductReview> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const review = await dbService.getItemById<ProductReview>("productReviews", reviewId);

        if (!review) {
            throw new Error("Avis non trouvé");
        }

        if (!review.adminResponse) {
            throw new Error("Cet avis n'a pas de réponse à supprimer");
        }

        // Supprimer la réponse
        const { adminResponse, ...reviewWithoutResponse } = review;
        const updatedReview: ProductReview = {
            ...reviewWithoutResponse,
            updatedAt: new Date()
        };

        await dbService.updateItem("productReviews", updatedReview);

        return updatedReview;
    } catch (error) {
        console.error(`Error in removeAdminResponse for review ${reviewId}:`, error);
        throw error;
    }
};

// Obtenir tous les avis d'un utilisateur (pour le profil utilisateur)
const getUserReviews = async (userId?: string): Promise<ProductReview[]> => {
    try {
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            throw new Error("Utilisateur non authentifié");
        }

        // Utiliser l'ID de l'utilisateur actuel si aucun ID n'est fourni
        const targetUserId = userId || currentUser.id;

        // Vérifier que l'utilisateur actuel peut accéder à ces avis
        if (targetUserId !== currentUser.id && !authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const allReviews = await dbService.getAllItems<ProductReview>("productReviews");
        
        // Si c'est un admin qui consulte les avis d'un autre utilisateur, montrer tous les avis
        // Si c'est l'utilisateur lui-même, montrer ses propres avis (même ceux en attente ou rejetés)
        return allReviews
            .filter(review => review.userId === targetUserId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error(`Error in getUserReviews for user ${userId}:`, error);
        return [];
    }
};

export const ratingService = {
    // Fonctions publiques
    createReview,
    updateReview,
    deleteReview,
    getProductReviews,
    getProductReviewsSummary,
    voteReview,
    removeVote,
    canUserReviewProduct,
    getUserReviews,
    // Fonctions admin
    getPendingReviews,
    approveReview,
    rejectReview,
    addAdminResponse,
    removeAdminResponse
};