// src/services/comment.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';
import { v4 as uuidv4 } from 'uuid';

export interface Comment {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    content: string;
    createdAt: Date;
    updatedAt?: Date;
    isVerified?: boolean;
    isApproved?: boolean;
    likes?: number;
}

class CommentService {
    // Récupérer les commentaires pour un produit
    async getProductComments(productId: string): Promise<Comment[]> {
        try {
            const comments = await dbService.getByIndex<Comment>('comments', 'productId', productId);
            return comments
                .filter(comment => comment.isApproved !== false)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error(`Error getting comments for product ${productId}:`, error);
            return [];
        }
    }

    // Ajouter un commentaire
    async addComment(data: Omit<Comment, 'id' | 'createdAt' | 'userName'>): Promise<Comment | null> {
        try {
            const currentUser = authService.getCurrentUser();

            if (!currentUser) {
                throw new Error('User must be authenticated to add a comment');
            }

            const newComment: Comment = {
                ...data,
                id: uuidv4(),
                userId: currentUser.id,
                userName: `${currentUser.firstName} ${currentUser.lastName}`,
                createdAt: new Date(),
                isApproved: true, // Auto-approve for now
            };

            await dbService.addItem('comments', newComment);

            // Update comment count for the product
            this.updateCommentCount(data.productId);

            return newComment;
        } catch (error) {
            console.error('Error adding comment:', error);
            return null;
        }
    }

    // Obtenir le nombre de commentaires pour un produit
    async getCommentCount(productId: string): Promise<number> {
        try {
            // Si le système est déjà configuré pour stocker le nombre de commentaires, utilisons-le
            try {
                const storedCount = await dbService.getItemById<{ count: number }>('commentCounts', productId);
                if (storedCount) {
                    return storedCount.count;
                }
            } catch (countError) {
                console.log('Comment count not found in storage, calculating...', countError);
            }

            // Sinon, comptons manuellement
            const comments = await this.getProductComments(productId);
            return comments.length;
        } catch (error) {
            console.error(`Error getting comment count for product ${productId}:`, error);
            return 0;
        }
    }

    // Mettre à jour le nombre de commentaires pour un produit
    private async updateCommentCount(productId: string): Promise<void> {
        try {
            const comments = await this.getProductComments(productId);

            await dbService.addItem('commentCounts', {
                id: productId,
                count: comments.length,
                updatedAt: new Date()
            }, true); // overwrite if exists
        } catch (error) {
            console.error(`Error updating comment count for product ${productId}:`, error);
        }
    }

    // Supprimer un commentaire
    async deleteComment(commentId: string): Promise<boolean> {
        try {
            const comment = await dbService.getItemById<Comment>('comments', commentId);

            if (!comment) {
                return false;
            }

            const currentUser = authService.getCurrentUser();

            // Verify permission: only the author or an admin can delete
            if (!currentUser || (currentUser.id !== comment.userId && !authService.isAdmin())) {
                throw new Error('Not authorized to delete this comment');
            }

            const success = await dbService.deleteItem('comments', commentId);

            if (success) {
                // Update comment count for the product
                this.updateCommentCount(comment.productId);
            }

            return success;
        } catch (error) {
            console.error(`Error deleting comment ${commentId}:`, error);
            return false;
        }
    }
}

export const commentService = new CommentService();