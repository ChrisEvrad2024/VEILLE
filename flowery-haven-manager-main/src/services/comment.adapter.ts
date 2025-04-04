// src/services/adapters/comment.adapter.ts
import { commentService, Comment } from '@/services/comment.service';

// Get comments for a product
const getProductComments = async (productId: string) => {
    try {
        return await commentService.getProductComments(productId);
    } catch (error) {
        console.error(`Error getting comments for product ${productId}:`, error);
        return [];
    }
};

// Add a new comment
const addComment = async (productId: string, rating: number, content: string) => {
    try {
        const newComment = await commentService.addComment({
            productId,
            rating,
            content,
            userId: '', // Will be filled by the service
        });

        if (!newComment) {
            throw new Error('Failed to add comment');
        }

        return { success: true, comment: newComment };
    } catch (error) {
        console.error(`Error adding comment for product ${productId}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

// Delete a comment
const deleteComment = async (commentId: string) => {
    try {
        const success = await commentService.deleteComment(commentId);

        if (!success) {
            throw new Error('Failed to delete comment');
        }

        return { success: true };
    } catch (error) {
        console.error(`Error deleting comment ${commentId}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

// Get comment count for a product
const getCommentCount = async (productId: string) => {
    try {
        return await commentService.getCommentCount(productId);
    } catch (error) {
        console.error(`Error getting comment count for product ${productId}:`, error);
        return 0;
    }
};

// Get comment counts for multiple products at once
const getCommentCounts = async (productIds: string[]) => {
    try {
        const result: Record<string, number> = {};

        // Use Promise.all for better performance
        const counts = await Promise.all(
            productIds.map(async id => ({
                id,
                count: await commentService.getCommentCount(id)
            }))
        );

        // Convert to object
        counts.forEach(item => {
            result[item.id] = item.count;
        });

        return result;
    } catch (error) {
        console.error('Error getting multiple comment counts:', error);
        return {};
    }
};

export const commentAdapter = {
    getProductComments,
    addComment,
    deleteComment,
    getCommentCount,
    getCommentCounts
};