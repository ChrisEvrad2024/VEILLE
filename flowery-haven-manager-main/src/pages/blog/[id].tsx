import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogService } from '@/services/blog.service';
import { BlogPost, BlogComment } from '@/types/blog';
import MainLayout from '@/components/layout/MainLayout';
import BlogCommentForm from '@/components/blog/BlogCommentForm';
import BlogCommentList from '@/components/blog/BlogCommentList';
import BlogSidebar from '@/components/blog/BlogSidebar';

export default function BlogPostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    async function fetchPostData() {
      try {
        setLoading(true);
        
        if (!id) {
          setError('ID d\'article invalide');
          return;
        }
        
        // Charger l'article
        const fetchedPost = await blogService.getPostById(Number(id));
        
        if (!fetchedPost) {
          setError('Article non trouvé');
          return;
        }
        
        setPost(fetchedPost);
        
        // Charger les commentaires
        const fetchedComments = await blogService.getCommentsByPostId(Number(id));
        setComments(fetchedComments);
        
        // Charger les articles associés (même catégorie)
        const categoryPosts = await blogService.getPostsByCategory(fetchedPost.category);
        const filtered = categoryPosts
          .filter(p => p.id !== fetchedPost.id)
          .slice(0, 3);
          
        setRelatedPosts(filtered);
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement de l\'article');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPostData();
  }, [id]);

  async function handleCommentAdded() {
    if (!id) return;
    
    try {
      const fetchedComments = await blogService.getCommentsByPostId(Number(id));
      setComments(fetchedComments);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12">
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !post) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
            <p className="mt-2">{error || 'Une erreur s\'est produite'}</p>
            <Link to="/blog" className="mt-4 inline-block text-primary hover:underline">
              Retour aux articles
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* En-tête de l'article */}
            <div className="mb-8">
              <Link 
                to={`/blog/category/${post.category}`} 
                className="text-sm font-medium text-primary uppercase tracking-wider"
              >
                {post.category}
              </Link>
              
              <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                {post.title}
              </h1>
              
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <span>{post.author}</span>
                <span className="mx-2">&bull;</span>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
            </div>
            
            {/* Image de couverture */}
            {post.imageUrl && (
              <div className="relative h-64 sm:h-96 mb-8 rounded-lg overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Contenu de l'article */}
            <div 
              className="prose prose-lg max-w-none prose-primary"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Link 
                    key={tag} 
                    to={`/blog/tag/${tag}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Section commentaires */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900">
                Commentaires ({comments.length})
              </h2>
              
              <BlogCommentList 
                comments={comments} 
                postId={Number(id)}
                onCommentAdded={handleCommentAdded}
              />
              
              <BlogCommentForm 
                postId={Number(id)} 
                onCommentAdded={handleCommentAdded} 
              />
            </div>
          </div>
          
          {/* Barre latérale */}
          <div className="lg:col-span-1">
            <BlogSidebar 
              currentPostId={Number(id)}
              relatedPosts={relatedPosts}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}