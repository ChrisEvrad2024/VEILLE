import { useState, useEffect, useCallback } from 'react';
import { blogService } from '@/services/blog.service';
import { BlogPost, BlogComment, BlogCategory } from '@/types/blog';

export function useBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les articles
  const loadPosts = useCallback(async (options?: {
    category?: string;
    tag?: string;
    featured?: boolean;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedPosts: BlogPost[];
      
      if (options?.featured) {
        fetchedPosts = await blogService.getFeaturedPosts(options.limit);
      } else if (options?.category) {
        fetchedPosts = await blogService.getPostsByCategory(options.category);
      } else if (options?.tag) {
        fetchedPosts = await blogService.getPostsByTag(options.tag);
      } else {
        fetchedPosts = await blogService.getAllPosts();
      }
      
      if (options?.limit) {
        fetchedPosts = fetchedPosts.slice(0, options.limit);
      }
      
      setPosts(fetchedPosts);
    } catch (err) {
      console.error("Error loading blog posts:", err);
      setError("Impossible de charger les articles du blog");
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les catégories
  const loadCategories = useCallback(async () => {
    try {
      const fetchedCategories = await blogService.getAllCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      console.error("Error loading blog categories:", err);
    }
  }, []);

  // Charger un article spécifique
  const getPost = useCallback(async (id: number): Promise<BlogPost | null> => {
    try {
      setLoading(true);
      setError(null);
      return await blogService.getPostById(id);
    } catch (err) {
      console.error(`Error loading blog post ${id}:`, err);
      setError(`Impossible de charger l'article #${id}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Gérer les commentaires
  const getComments = useCallback(async (postId: number): Promise<BlogComment[]> => {
    try {
      return await blogService.getCommentsByPostId(postId);
    } catch (err) {
      console.error(`Error loading comments for post ${postId}:`, err);
      return [];
    }
  }, []);

  const addComment = useCallback(async (
    postId: number,
    author: string,
    content: string,
    email?: string,
    parentId?: number
  ): Promise<BlogComment | null> => {
    try {
      return await blogService.addComment({
        postId,
        author,
        content,
        email,
        parentId
      });
    } catch (err) {
      console.error(`Error adding comment to post ${postId}:`, err);
      return null;
    }
  }, []);

  // Charger les données initiales
  useEffect(() => {
    loadPosts();
    loadCategories();
  }, [loadPosts, loadCategories]);

  return {
    posts,
    categories,
    loading,
    error,
    loadPosts,
    loadCategories,
    getPost,
    getComments,
    addComment
  };
}