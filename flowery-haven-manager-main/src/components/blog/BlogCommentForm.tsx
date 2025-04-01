import React, { useState } from 'react';
import { blogService } from '@/services/blog.service';
import { authService } from '@/services/auth.service';

interface BlogCommentFormProps {
  postId: number;
  parentId?: number;
  onCommentAdded: () => void;
}

export default function BlogCommentForm({ postId, parentId, onCommentAdded }: BlogCommentFormProps) {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentUser = authService.getCurrentUser();
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Le commentaire ne peut pas être vide');
      return;
    }
    
    if (!currentUser && !author.trim()) {
      setError('Veuillez indiquer votre nom');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const commentData = {
        postId,
        content,
        author: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : author,
        email: currentUser ? currentUser.email : email,
        parentId
      };
      
      await blogService.addComment(commentData);
      
      // Réinitialiser le formulaire
      setContent('');
      setAuthor('');
      setEmail('');
      
      // Notifier le parent que le commentaire a été ajouté
      onCommentAdded();
      
      // Si l'utilisateur n'est pas admin, afficher un message
      if (!authService.isAdmin()) {
        alert('Votre commentaire a été soumis et sera visible après modération.');
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du commentaire:', err);
      setError('Une erreur est survenue lors de l\'envoi du commentaire');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {/* Titre du formulaire */}
      <h3 className="text-lg font-semibold">
        {parentId ? 'Répondre au commentaire' : 'Laisser un commentaire'}
      </h3>
      
      {/* Zone de texte pour le commentaire */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
          Commentaire
        </label>
        <textarea
          id="comment"
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      
      {/* Champs d'informations si l'utilisateur n'est pas connecté */}
      {!currentUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700">
              Nom
            </label>
            <input
              type="text"
              id="author"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      
      {/* Bouton de soumission */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Envoi...
            </>
          ) : (
            'Publier'
          )}
        </button>
      </div>
    </form>
  );
}