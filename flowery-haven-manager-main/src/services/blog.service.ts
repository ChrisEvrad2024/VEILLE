// src/services/blog.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';
import { BlogPost, BlogComment, BlogCategory } from '@/types/blog';

class BlogService {
    // CRUD pour les articles
    async getAllPosts(includeUnpublished = false): Promise<BlogPost[]> {
        try {
            const posts = await dbService.getAllItems<BlogPost>("blog");

            if (!includeUnpublished && !authService.isAdmin()) {
                return posts.filter(post => post.status === 'published');
            }

            return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (error) {
            console.error("Error fetching blog posts:", error);
            return [];
        }
    }

    async getPostById(id: number): Promise<BlogPost | null> {
        try {
            const post = await dbService.getItemById<BlogPost>("blog", id);

            if (!post) return null;

            // Verify if the user is allowed to see this post
            if (post.status !== 'published' && !authService.isAdmin()) {
                return null;
            }

            // N'incrémenter les vues que pour les articles publiés
            if (post.status === 'published') {
                post.viewCount = (post.viewCount || 0) + 1;
                await dbService.updateItem("blog", post);
            }

            // Get comments count for this post
            const comments = await this.getCommentsByPostId(id);
            post.commentCount = comments.filter(c => c.status === 'approved').length;

            return post;
        } catch (error) {
            console.error(`Error fetching blog post ${id}:`, error);
            return null;
        }
    }

    async createPost(postData: Partial<BlogPost>): Promise<BlogPost> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        const now = new Date().toISOString();
        const newPost: BlogPost = {
            ...postData as BlogPost,
            id: Date.now(), // Generate unique ID
            viewCount: 0,
            commentCount: 0,
            createdAt: now,
            updatedAt: now,
            slug: this.generateSlug(postData.title || 'untitled'),
            status: postData.status || 'draft',
        };

        return await dbService.addItem("blog", newPost);
    }

    async updatePost(id: number, postData: Partial<BlogPost>): Promise<BlogPost> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        const existingPost = await this.getPostById(id);
        if (!existingPost) {
            throw new Error("Post not found");
        }

        // Check if status is changing from draft to published
        const isPublishing = existingPost.status !== 'published' && postData.status === 'published';
        
        // If publishing now, update the publish date
        if (isPublishing && !postData.publishDate) {
            postData.publishDate = new Date().toISOString();
        }

        const updatedPost = {
            ...existingPost,
            ...postData,
            updatedAt: new Date().toISOString()
        };

        return await dbService.updateItem("blog", updatedPost);
    }

    async deletePost(id: number): Promise<boolean> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        // Supprimer tous les commentaires associés
        const comments = await this.getCommentsByPostId(id);
        for (const comment of comments) {
            if (comment.id) {
                await dbService.deleteItem("blogComments", comment.id);
            }
        }

        return await dbService.deleteItem("blog", id);
    }

    // Publish or unpublish a post
    async publishPost(id: number, publish: boolean = true): Promise<BlogPost | null> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        const post = await this.getPostById(id);
        if (!post) {
            return null;
        }

        const updated = await this.updatePost(id, {
            status: publish ? 'published' : 'draft',
            publishDate: publish ? new Date().toISOString() : undefined
        });

        return updated;
    }

    // Schedule a post for publication
    async schedulePost(id: number, publishDate: string): Promise<BlogPost | null> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        const post = await this.getPostById(id);
        if (!post) {
            return null;
        }

        // Ensure the publish date is in the future
        const scheduleDate = new Date(publishDate);
        if (scheduleDate <= new Date()) {
            throw new Error("Schedule date must be in the future");
        }

        const updated = await this.updatePost(id, {
            status: 'draft',
            publishDate: scheduleDate.toISOString()
        });

        return updated;
    }

    // Automatically publish scheduled posts
    async processScheduledPosts(): Promise<number> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        let publishedCount = 0;
        const now = new Date();
        const allPosts = await this.getAllPosts(true);

        for (const post of allPosts) {
            if (
                post.status === 'draft' && 
                post.publishDate && 
                new Date(post.publishDate) <= now
            ) {
                await this.updatePost(post.id, {
                    status: 'published',
                });
                publishedCount++;
            }
        }

        return publishedCount;
    }

    // Méthodes pour les commentaires
    async getAllComments(): Promise<BlogComment[]> {
        try {
            if (!authService.isAdmin()) {
                throw new Error("Unauthorized: Admin access required");
            }

            const allComments = await dbService.getAllItems<BlogComment>("blogComments");
            return allComments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (error) {
            console.error("Error fetching all comments:", error);
            return [];
        }
    }

    async getCommentsByPostId(postId: number): Promise<BlogComment[]> {
        try {
            const allComments = await dbService.getByIndex<BlogComment>("blogComments", "postId", postId);

            // N'afficher que les commentaires approuvés aux utilisateurs non-admin
            if (!authService.isAdmin()) {
                return allComments.filter(comment => comment.status === 'approved');
            }

            return allComments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } catch (error) {
            console.error(`Error fetching comments for post ${postId}:`, error);
            return [];
        }
    }

    async addComment(commentData: Partial<BlogComment>): Promise<BlogComment | null> {
        const isAdmin = authService.isAdmin();
        const currentUser = authService.getCurrentUser();

        try {
            // Check if the post exists and is published
            const post = await this.getPostById(commentData.postId!);
            if (!post) {
                throw new Error("Post not found or not published");
            }

            const newComment: BlogComment = {
                postId: commentData.postId!,
                parentId: commentData.parentId,
                author: commentData.author || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Anonymous'),
                authorId: currentUser?.id,
                authorEmail: commentData.authorEmail || currentUser?.email,
                content: commentData.content || '',
                date: new Date().toISOString(),
                status: isAdmin ? 'approved' : 'pending',
                reactions: [
                    { type: 'like', count: 0, users: [] },
                    { type: 'love', count: 0, users: [] },
                    { type: 'laugh', count: 0, users: [] }
                ]
            };

            const savedComment = await dbService.addItem("blogComments", newComment);
            return savedComment;
        } catch (error) {
            console.error("Error adding comment:", error);
            return null;
        }
    }

    async approveComment(commentId: number): Promise<boolean> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        try {
            const comment = await dbService.getItemById<BlogComment>("blogComments", commentId);
            if (!comment) return false;

            comment.status = 'approved';
            await dbService.updateItem("blogComments", comment);
            
            // Update comment count on the post
            const post = await this.getPostById(comment.postId);
            if (post) {
                post.commentCount = (post.commentCount || 0) + 1;
                await dbService.updateItem("blog", post);
            }
            
            return true;
        } catch (error) {
            console.error("Error approving comment:", error);
            return false;
        }
    }

    async rejectComment(commentId: number): Promise<boolean> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        try {
            const comment = await dbService.getItemById<BlogComment>("blogComments", commentId);
            if (!comment) return false;

            comment.status = 'rejected';
            await dbService.updateItem("blogComments", comment);
            return true;
        } catch (error) {
            console.error("Error rejecting comment:", error);
            return false;
        }
    }

    async deleteComment(commentId: number): Promise<boolean> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        try {
            // Check for any replies to this comment and delete them first
            const replies = await dbService.getByIndex<BlogComment>("blogComments", "parentId", commentId);
            for (const reply of replies) {
                if (reply.id) {
                    await dbService.deleteItem("blogComments", reply.id);
                }
            }

            // Delete the comment itself
            return await dbService.deleteItem("blogComments", commentId);
        } catch (error) {
            console.error("Error deleting comment:", error);
            return false;
        }
    }

    // Gestion des catégories
    async getAllCategories(): Promise<BlogCategory[]> {
        try {
            const categories = await dbService.getAllItems<BlogCategory>("blogCategories");

            // Calculer le nombre d'articles par catégorie
            const posts = await this.getAllPosts(false);

            return categories.map(category => {
                const postCount = posts.filter(post => post.category === category.id).length;
                return { ...category, postCount };
            });
        } catch (error) {
            console.error("Error fetching blog categories:", error);
            return [];
        }
    }

    async createCategory(category: Partial<BlogCategory>): Promise<BlogCategory | null> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        try {
            const newCategory: BlogCategory = {
                ...category as BlogCategory,
                id: Date.now(),
                slug: this.generateSlug(category.name || 'category'),
                postCount: 0
            };

            return await dbService.addItem("blogCategories", newCategory);
        } catch (error) {
            console.error("Error creating category:", error);
            return null;
        }
    }

    // Fetch posts by category
    async getPostsByCategory(categoryId: number): Promise<BlogPost[]> {
        try {
            const allPosts = await this.getAllPosts(authService.isAdmin());
            return allPosts.filter(post => post.category === categoryId);
        } catch (error) {
            console.error(`Error fetching posts for category ${categoryId}:`, error);
            return [];
        }
    }

    // Fetch posts by tag
    async getPostsByTag(tag: string): Promise<BlogPost[]> {
        try {
            const allPosts = await this.getAllPosts(authService.isAdmin());
            return allPosts.filter(post => post.tags && post.tags.includes(tag));
        } catch (error) {
            console.error(`Error fetching posts for tag ${tag}:`, error);
            return [];
        }
    }

    // Fetch featured posts
    async getFeaturedPosts(limit?: number): Promise<BlogPost[]> {
        try {
            // In a real implementation, there might be a 'featured' flag in the posts
            // For simplicity, we're just returning the most recent published posts
            const publishedPosts = await this.getAllPosts(false);
            let featured = publishedPosts.slice(0, limit || 5);
            return featured;
        } catch (error) {
            console.error("Error fetching featured posts:", error);
            return [];
        }
    }

    // Utilitaires
    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
}

export const blogService = new BlogService();