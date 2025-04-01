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

            // N'incrémenter les vues que pour les articles publiés
            if (post.status === 'published') {
                post.viewCount = (post.viewCount || 0) + 1;
                await dbService.updateItem("blog", post);
            }

            return post;
        } catch (error) {
            console.error(`Error fetching blog post ${id}:`, error);
            return null;
        }
    }

    async createPost(postData: Omit<BlogPost, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        const now = new Date().toISOString();
        const newPost: BlogPost = {
            ...postData,
            id: Date.now(),
            viewCount: 0,
            createdAt: now,
            updatedAt: now,
            slug: this.generateSlug(postData.title)
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

    // Méthodes pour les commentaires
    async getCommentsByPostId(postId: number): Promise<BlogComment[]> {
        try {
            const allComments = await dbService.getByIndex<BlogComment>("blogComments", "postId", postId);

            // N'afficher que les commentaires approuvés aux utilisateurs non-admin
            if (!authService.isAdmin()) {
                return allComments.filter(comment => comment.status === 'approved');
            }

            return allComments;
        } catch (error) {
            console.error(`Error fetching comments for post ${postId}:`, error);
            return [];
        }
    }

    async addComment(comment: Omit<BlogComment, 'id' | 'date' | 'status'>): Promise<BlogComment> {
        const isAdmin = authService.isAdmin();

        const newComment: BlogComment = {
            ...comment,
            date: new Date().toISOString(),
            status: isAdmin ? 'approved' : 'pending',
            reactions: [
                { type: 'like', count: 0, users: [] },
                { type: 'love', count: 0, users: [] },
                { type: 'laugh', count: 0, users: [] }
            ]
        };

        return await dbService.addItem("blogComments", newComment);
    }

    async approveComment(commentId: number): Promise<boolean> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        const comment = await dbService.getItemById<BlogComment>("blogComments", commentId);
        if (!comment) return false;

        comment.status = 'approved';
        await dbService.updateItem("blogComments", comment);
        return true;
    }

    async rejectComment(commentId: number): Promise<boolean> {
        if (!authService.isAdmin()) {
            throw new Error("Unauthorized: Admin access required");
        }

        const comment = await dbService.getItemById<BlogComment>("blogComments", commentId);
        if (!comment) return false;

        comment.status = 'rejected';
        await dbService.updateItem("blogComments", comment);
        return true;
    }

    // Gestion des catégories
    async getAllCategories(): Promise<BlogCategory[]> {
        const categories = await dbService.getAllItems<BlogCategory>("blogCategories");

        // Calculer le nombre d'articles par catégorie
        const posts = await this.getAllPosts(false);

        return categories.map(category => {
            const postCount = posts.filter(post => post.category === category.id).length;
            return { ...category, postCount };
        });
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