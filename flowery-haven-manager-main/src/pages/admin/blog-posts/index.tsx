import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '@/services/blog.service';
import { BlogPost } from '@/types/blog';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const fetchedPosts = await blogService.getAllPosts(true); // true = inclure les brouillons
        setPosts(fetchedPosts);
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des articles');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, []);

  // Filtrer les articles selon la recherche et le statut
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Gérer la suppression d'un article
  async function handleDelete(postId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }
    
    try {
      await blogService.deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression de l\'article');
    }
  }

  // Gérer la suppression en masse
  async function handleBulkDelete() {
    if (selectedPosts.length === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedPosts.length} article(s) ?`)) {
      return;
    }
    
    try {
      for (const postId of selectedPosts) {
        await blogService.deletePost(postId);
      }
      
      setPosts(posts.filter(post => !selectedPosts.includes(post.id)));
      setSelectedPosts([]);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression des articles');
    }
  }

  // Gérer la publication/dépublication en masse
  async function handleBulkStatusChange(status: 'published' | 'draft') {
    if (selectedPosts.length === 0) return;
    
    try {
      for (const postId of selectedPosts) {
        await blogService.updatePost(postId, { status });
      }
      
      // Mettre à jour l'état local
      setPosts(posts.map(post => {
        if (selectedPosts.includes(post.id)) {
          return { ...post, status };
        }
        return post;
      }));
      
      setSelectedPosts([]);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour du statut des articles');
    }
  }

  // Gérer la sélection d'un article
  function handleSelectPost(postId: number, isSelected: boolean) {
    if (isSelected) {
      setSelectedPosts([...selectedPosts, postId]);
    } else {
      setSelectedPosts(selectedPosts.filter(id => id !== postId));
    }
  }

  // Gérer la sélection de tous les articles
  function handleSelectAll(isSelected: boolean) {
    if (isSelected) {
      setSelectedPosts(filteredPosts.map(post => post.id));
    } else {
      setSelectedPosts([]);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Gestion des articles</h1>
            <p className="mt-2 text-sm text-gray-700">
              Liste de tous les articles du blog, publiés ou en brouillon.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/admin/blog-posts/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Ajouter un article
            </Link>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-sm w-full">
            <label htmlFor="search" className="sr-only">Rechercher</label>
            <input
              type="text"
              id="search"
              placeholder="Rechercher un article..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">Tous les statuts</option>
              <option value="published">Publiés</option>
              <option value="draft">Brouillons</option>
            </select>
            
            {selectedPosts.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusChange('published')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Publier
                </button>
                <button
                  onClick={() => handleBulkStatusChange('draft')}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Brouillon
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table des articles */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300"
                          checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </th>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Titre
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Catégorie
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Statut
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Vues
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-sm text-gray-500">
                          Aucun article trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((post) => (
                        <tr key={post.id} className={selectedPosts.includes(post.id) ? 'bg-gray-50' : undefined}>
                          <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                            <input
                              type="checkbox"
                              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300"
                              checked={selectedPosts.includes(post.id)}
                              onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                            />
                          </td>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {post.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {post.category}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {post.status === 'published' ? 'Publié' : 'Brouillon'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(post.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {post.viewCount}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-2">
                              <Link
                                to={`/blog/${post.id}`}
                                target="_blank"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Voir
                              </Link>
                              <Link
                                to={`/admin/blog-posts/${post.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Modifier
                              </Link>
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}