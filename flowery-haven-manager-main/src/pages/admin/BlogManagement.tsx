
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Eye, 
  Calendar,
  Filter,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { BlogPostForm } from "@/components/admin/BlogPostForm";
import { BlogPost } from "@/types/blog";
import { getAllBlogPosts } from "@/lib/blog";

// Interface for the form post data
interface FormPostData {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  authorId: string;
  authorName: string;
  publishDate: Date;
  status: "draft" | "published";
  imageUrl: string;
  category: string;
  tags: string[];
}

const BlogManagement = async () => {
  const [posts, setPosts] = useState<BlogPost[]>(getAllBlogPosts());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FormPostData | null>(null);
  
  // Filter posts based on search query
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // View post details
  const handleViewPost = (post: BlogPost) => {
    setSelectedPost(post);
    setIsViewDialogOpen(true);
  };
  
  // Handle post deletion
  const handleDeletePost = (postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
    toast.success("Article supprimé", {
      description: "L'article a été supprimé avec succès."
    });
  };

  // Handle edit post
  const handleEditPost = (post: BlogPost) => {
    // Convert to format expected by BlogPostForm
    const formattedPost: FormPostData = {
      id: `${post.id}`,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content || "",
      authorId: `auth-${Date.now()}`,
      authorName: post.author,
      publishDate: new Date(post.date),
      status: "published" as const,
      imageUrl: post.imageUrl,
      category: post.category,
      tags: post.tags || [],
    };
    
    setEditingPost(formattedPost);
    setIsFormDialogOpen(true);
  };
  
  // Handle adding new post
  const handleAddPost = async () => {
    setEditingPost(null);
    setIsFormDialogOpen(true);
  };

  // Handle save post
  const handleSavePost = (formPost: FormPostData) => {
    // Convert from BlogPostForm format to our BlogPost format
    const newPost: BlogPost = {
      id: editingPost ? Number(editingPost.id) : Date.now(),
      title: formPost.title,
      excerpt: formPost.excerpt,
      content: formPost.content,
      author: formPost.authorName,
      date: format(formPost.publishDate, 'yyyy-MM-dd'),
      category: formPost.category,
      imageUrl: formPost.imageUrl,
      tags: formPost.tags,
    };

    if (editingPost) {
      // Update existing post
      setPosts(posts.map(p => p.id === newPost.id ? newPost : p));
      toast.success("Article mis à jour", {
        description: "L'article a été mis à jour avec succès."
      });
    } else {
      // Add new post
      setPosts([...posts, newPost]);
      toast.success("Article ajouté", {
        description: "L'article a été ajouté avec succès."
      });
    }
    setIsFormDialogOpen(false);
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Publié</Badge>;
      case "draft":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date for display
  const formatPublishDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">Gérez les articles de votre blog.</p>
        </div>
        <Button onClick={handleAddPost}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un article..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Catégories
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Tous les articles</DropdownMenuItem>
                  <DropdownMenuItem>Conseils</DropdownMenuItem>
                  <DropdownMenuItem>Tendances</DropdownMenuItem>
                  <DropdownMenuItem>Événements</DropdownMenuItem>
                  <DropdownMenuItem>Inspiration</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell className="capitalize">{post.category}</TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell className="text-center">
                      {formatPublishDate(post.date)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPost(post)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPost(post)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPosts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Aucun article trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {filteredPosts.length} sur {posts.length} articles
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Précédent</Button>
            <Button variant="outline" size="sm" disabled>Suivant</Button>
          </div>
        </CardFooter>
      </Card>

      {/* View Post Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[725px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPost?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <img 
                  src={selectedPost.imageUrl} 
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatPublishDate(selectedPost.date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground capitalize">
                    {selectedPost.category}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Auteur: {selectedPost.author}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Résumé</h3>
                <p>{selectedPost.excerpt}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Contenu</h3>
                <div className="prose prose-sm max-w-none">
                  <p>{selectedPost.content}</p>
                </div>
              </div>
              
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Add Post Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[725px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Modifier un article' : 'Ajouter un article'}
            </DialogTitle>
          </DialogHeader>
          <BlogPostForm 
            post={editingPost}
            onSubmit={handleSavePost}
            onCancel={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;
