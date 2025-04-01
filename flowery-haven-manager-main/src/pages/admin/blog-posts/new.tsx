import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogService } from '@/services/blog.service';
import AdminLayout from '@/components/layout/AdminLayout';
import RichTextEditor from '@/components/common/RichTextEditor';
import ImageSelector from '@/components/admin/blog/ImageSelector';

export default function NewBlogPost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const newPost = await blogService.createPost({
        title,
        excerpt,
        content,
        category,
        imageUrl,
        tags: tags.split(',').map(tag => tag.trim()),
        status,
        date: new Date().toISOString(),
        featured: false
      });
      
      navigate(`/admin/blog-posts/${newPost.id}/edit`, { 
        state: { success: 'Article créé avec succès!' }
      });
    } catch (err) {
      setError('Erreur lors de la création de l\'article');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }
  
  // Fonction pour insérer une image dans l'éditeur
  const insertImage = (url: string) => {
    // Insérer l'image à l'emplacement du curseur dans l'éditeur
    const imageHtml = `<img src="${url}" alt="Image" class="my-4 max-w-full h-auto" />`;
    setContent(prev => prev + imageHtml);
  };
  
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Nouvel article</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          
          {/* Extrait */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">Extrait *</label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          
          {/* Contenu */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">Contenu *</label>
            <div className="flex items-center mb-2">
              <button
                type="button"
                onClick={() => setShowImageSelector(true)}
                className="p-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                title="Insérer une image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </button>
            </div>
            <RichTextEditor
              value={content}
              onChange={setContent}
              className="min-h-[400px] mt-1"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Catégorie */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Catégorie *</label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            {/* Image URL avec bouton de sélection */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">URL de l'image</label>
              <div className="flex">
                <input
                  type="url"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-l-md shadow-sm p-2"
                />
                <button
                  type="button"
                  onClick={() => setShowImageSelector(true)}
                  className="mt-1 border border-gray-300 border-l-0 rounded-r-md px-3 bg-gray-50 hover:bg-gray-100"
                >
                  Parcourir
                </button>
              </div>
            </div>
            
            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (séparés par des virgules)</label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            
            {/* Statut */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin/blog-posts')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark"
            >
              {submitting ? 'Création...' : 'Créer l\'article'}
            </button>
          </div>
        </form>
        
        {/* Sélecteur d'images */}
        {showImageSelector && (
          <ImageSelector
            onSelect={(url) => {
              setImageUrl(url);
              setShowImageSelector(false);
            }}
            onClose={() => setShowImageSelector(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
}