import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '@/services/blog.service';
import { BlogPost } from '@/types/blog';

interface BlogListProps {
  category?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
}

export default function BlogList({ category, tag, featured, limit }: BlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        let fetchedPosts: BlogPost[] = [];
        
        if (featured) {
          fetchedPosts = await blogService.getFeaturedPosts(limit);
        } else if (category) {
          fetchedPosts = await blogService.getPostsByCategory(category);
        } else if (tag) {
          fetchedPosts = await blogService.getPostsByTag(tag);
        } else {
          fetchedPosts = await blogService.getAllPosts();
        }
        
        if (limit) {
          fetchedPosts = fetchedPosts.slice(0, limit);
        }
        
        setPosts(fetchedPosts);
      } catch (err) {
        setError('Erreur lors du chargement des articles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, [category, tag, featured, limit]);

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (posts.length === 0) {
    return <div className="p-4 text-center">Aucun article trouvé</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map(post => (
        <article key={post.id} className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          {post.imageUrl && (
            <Link to={`/blog/${post.id}`} className="block h-48 overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            </Link>
          )}
          
          <div className="p-4">
            <Link to={`/blog/category/${post.category}`} className="text-xs font-medium text-primary uppercase tracking-wider">
              {post.category}
            </Link>
            
            <h2 className="mt-2 text-xl font-semibold">
              <Link to={`/blog/${post.id}`} className="hover:text-primary transition-colors">
                {post.title}
              </Link>
            </h2>
            
            <p className="mt-2 text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(post.date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              
              <Link to={`/blog/${post.id}`} className="text-sm font-medium text-primary hover:underline">
                Lire la suite
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}