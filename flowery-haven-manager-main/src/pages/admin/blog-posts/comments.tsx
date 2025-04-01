import React, { useState, useEffect } from 'react';
import { blogService } from '@/services/blog.service';
import { BlogComment } from '@/types/blog';
import AdminLayout from '@/components/layout/AdminLayout';

export default function CommentModeration() {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        const allComments = await blogService.getAllComments();
        setComments(allComments);
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des commentaires');
      } finally {
        setLoading(false);
      }
    }
    
    fetchComments();
  }, []);

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    return comment.status === filter;
  });

  async function handleApprove(commentId: number) {
    try {
      await blogService.approveComment(commentId);
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, status: 'approved' } 
          : comment
      ));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'approbation du commentaire');
    }
  }

  async function handleReject(commentId: number) {
    try {
      await blogService.rejectComment(commentId);
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, status: 'rejected' } 
          : comment
      ));
    } catch (err) {
      console.error(err);
      alert('Erreur lors du rejet du commentaire');
    }
  }

  async function handleDelete(commentId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }
    
    try {
      await blogService.deleteComment(commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression du commentaire');
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Modération des commentaires</h1>
        
        <div className="mb-6">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="all">Tous les commentaires</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
          </select>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center text-gray-500 p-8">
            Aucun commentaire {filter !== 'all' ? `avec le statut "${filter}"` : ''}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auteur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commentaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComments.map(comment => (
                  <tr key={comment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">Post #{comment.postId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{comment.author}</div>
                      {comment.email && (
                        <div className="text-xs text-gray-500">{comment.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs break-words">
                        {comment.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(comment.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        comment.status === 'approved' ? 'bg-green-100 text-green-800' :
                        comment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {comment.status === 'approved' ? 'Approuvé' :
                         comment.status === 'rejected' ? 'Rejeté' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {comment.status !== 'approved' && (
                          <button 
                            onClick={() => handleApprove(comment.id!)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approuver
                          </button>
                        )}
                        {comment.status !== 'rejected' && (
                          <button 
                            onClick={() => handleReject(comment.id!)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Rejeter
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(comment.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}