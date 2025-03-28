// src/services/blog.service.ts
import { dbService } from './db.service';
import { authService } from './auth.service';

// Types pour le blog
export interface BlogComment {
    id?: number;
    postId: number;
    author: string;
    content: string;
    date: string;
    email?: string;
    parentId?: number;
    reactions?: {
        type: "like" | "love" | "laugh";
        count: number;
    }[];
}

export interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    date: string;
    author: string;
    category: string;
    imageUrl: string;
    tags?: string[];
    viewCount: number;
    featured: boolean;
}

// Récupérer tous les articles
const getAllPosts = async (): Promise<BlogPost[]> => {
    try {
        return await dbService.getAllItems<BlogPost>("blog");
    } catch (error) {
        console.error("Error in getAllPosts:", error);
        return [];
    }
};

// Récupérer un article par son ID
const getPostById = async (postId: number): Promise<BlogPost | null> => {
    try {
        const post = await dbService.getItemById<BlogPost>("blog", postId);

        if (!post) {
            return null;
        }

        // Incrémenter le compteur de vues
        post.viewCount = (post.viewCount || 0) + 1;
        await dbService.updateItem("blog", post);

        return post;
    } catch (error) {
        console.error(`Error in getPostById for post ${postId}:`, error);
        return null;
    }
};

// Récupérer les articles par catégorie
const getPostsByCategory = async (category: string): Promise<BlogPost[]> => {
    try {
        return await dbService.getByIndex<BlogPost>("blog", "category", category);
    } catch (error) {
        console.error(`Error in getPostsByCategory for category ${category}:`, error);
        return [];
    }
};

// Récupérer les articles récents
const getRecentPosts = async (count: number = 3): Promise<BlogPost[]> => {
    try {
        const posts = await getAllPosts();
        return posts
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, count);
    } catch (error) {
        console.error("Error in getRecentPosts:", error);
        return [];
    }
};

// Récupérer les articles populaires
const getPopularPosts = async (count: number = 3): Promise<BlogPost[]> => {
    try {
        const posts = await getAllPosts();
        return posts
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, count);
    } catch (error) {
        console.error("Error in getPopularPosts:", error);
        return [];
    }
};

// Récupérer les articles en vedette
const getFeaturedPosts = async (count: number = 3): Promise<BlogPost[]> => {
    try {
        const featuredPosts = await dbService.getByIndex<BlogPost>("blog", "featured", true);
        return featuredPosts.slice(0, count);
    } catch (error) {
        console.error("Error in getFeaturedPosts:", error);
        return [];
    }
};

// Rechercher des articles
const searchPosts = async (query: string): Promise<BlogPost[]> => {
    try {
        const posts = await getAllPosts();
        const lowercaseQuery = query.toLowerCase();

        return posts.filter(post =>
            post.title.toLowerCase().includes(lowercaseQuery) ||
            post.excerpt.toLowerCase().includes(lowercaseQuery) ||
            post.content.toLowerCase().includes(lowercaseQuery) ||
            post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    } catch (error) {
        console.error(`Error in searchPosts for query ${query}:`, error);
        return [];
    }
};

// Récupérer les articles par tag
const getPostsByTag = async (tag: string): Promise<BlogPost[]> => {
    try {
        const posts = await getAllPosts();
        return posts.filter(post => post.tags?.includes(tag));
    } catch (error) {
        console.error(`Error in getPostsByTag for tag ${tag}:`, error);
        return [];
    }
};

// Récupérer tous les tags
const getAllTags = async (): Promise<string[]> => {
    try {
        const posts = await getAllPosts();
        const tagsSet = new Set<string>();

        posts.forEach(post => {
            post.tags?.forEach(tag => {
                tagsSet.add(tag.toLowerCase());
            });
        });

        return Array.from(tagsSet);
    } catch (error) {
        console.error("Error in getAllTags:", error);
        return [];
    }
};

// Trier les articles
const sortPosts = (posts: BlogPost[], sortBy: 'date' | 'popularity' | 'title'): BlogPost[] => {
    switch (sortBy) {
        case 'date':
            return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        case 'popularity':
            return [...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        case 'title':
            return [...posts].sort((a, b) => a.title.localeCompare(b.title));
        default:
            return posts;
    }
};

// Fonctions administratives

// Ajouter un article (admin uniquement)
const addPost = async (post: Omit<BlogPost, 'id' | 'viewCount'>): Promise<BlogPost> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        const newPost: BlogPost = {
            ...post,
            id: Date.now(),
            viewCount: 0
        };

        await dbService.addItem("blog", newPost);

        return newPost;
    } catch (error) {
        console.error("Error in addPost:", error);
        throw error;
    }
};

// Mettre à jour un article (admin uniquement)
const updatePost = async (post: BlogPost): Promise<BlogPost> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        await dbService.updateItem("blog", post);

        return post;
    } catch (error) {
        console.error(`Error in updatePost for post ${post.id}:`, error);
        throw error;
    }
};

// Supprimer un article (admin uniquement)
const deletePost = async (postId: number): Promise<boolean> => {
    try {
        if (!authService.isAdmin()) {
            throw new Error("Permission refusée");
        }

        await dbService.deleteItem("blog", postId);

        // Supprimer également les commentaires associés
        const comments = await getCommentsForPost(postId);

        for (const comment of comments) {
            if (comment.id) {
                await dbService.deleteItem("blogComments", comment.id);
            }
        }

        return true;
    } catch (error) {
        console.error(`Error in deletePost for post ${postId}:`, error);
        return false;
    }
};

// Gestion des commentaires

// Récupérer les commentaires d'un article
const getCommentsForPost = async (postId: number): Promise<BlogComment[]> => {
    try {
        return await dbService.getByIndex<BlogComment>("blogComments", "postId", postId);
    } catch (error) {
        console.error(`Error in getCommentsForPost for post ${postId}:`, error);
        return [];
    }
};

// Ajouter un commentaire
const addComment = async (
    postId: number,
    author: string,
    content: string,
    parentId?: number,
    email?: string
): Promise<BlogComment> => {
    try {
        const newComment: BlogComment = {
            postId,
            author,
            content,
            date: new Date().toISOString(),
            parentId,
            email,
            reactions: [
                { type: 'like', count: 0 },
                { type: 'love', count: 0 },
                { type: 'laugh', count: 0 }
            ]
        };

        const addedComment = await dbService.addItem("blogComments", newComment);

        return addedComment;
    } catch (error) {
        console.error(`Error in addComment for post ${postId}:`, error);
        throw error;
    }
};

// Ajouter une réaction à un commentaire
const addReactionToComment = async (
    postId: number,
    commentId: number,
    reactionType: "like" | "love" | "laugh"
): Promise<boolean> => {
    try {
        const comment = await dbService.getItemById<BlogComment>("blogComments", commentId);

        if (!comment) {
            return false;
        }

        if (!comment.reactions) {
            comment.reactions = [
                { type: 'like', count: 0 },
                { type: 'love', count: 0 },
                { type: 'laugh', count: 0 }
            ];
        }

        const reaction = comment.reactions.find(r => r.type === reactionType);

        if (reaction) {
            reaction.count += 1;
        }

        await dbService.updateItem("blogComments", comment);

        return true;
    } catch (error) {
        console.error(`Error in addReactionToComment for comment ${commentId}:`, error);
        return false;
    }
};

export const blogService = {
    getAllPosts,
    getPostById,
    getPostsByCategory,
    getRecentPosts,
    getPopularPosts,
    getFeaturedPosts,
    searchPosts,
    getPostsByTag,
    getAllTags,
    sortPosts,
    addPost,
    updatePost,
    deletePost,
    getCommentsForPost,
    addComment,
    addReactionToComment
};