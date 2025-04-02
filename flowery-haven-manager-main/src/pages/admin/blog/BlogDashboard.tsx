// src/pages/admin/blog/BlogDashboard.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  Clock,
  FileText,
  MessageCircle,
  Filter,
  ArrowUpDown,
  CheckCircle,
  Clock3,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { blogService } from "@/services/blog.service";
import { BlogPost } from "@/types/blog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BlogPostForm } from "@/components/admin/BlogPostForm";

const BlogDashboard = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "scheduled">("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "views">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [categories, setCategories] = useState<string[]>([]);
  
  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [schedulingPost, setSchedulingPost] = useState<BlogPost | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      // Get all posts including drafts (true parameter)
      const allPosts = await blogService.getAllPosts(true);
      setPosts(allPosts);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(allPosts.map((post) => post.category))
      );
      setCategories(uniqueCategories);
      
      // Apply initial filters
      applyFilters(allPosts, searchQuery, selectedCategory, statusFilter, sortBy, sortOrder);
    } catch (error) {
      console.error("Error loading blog posts:", error);
      toast.error("Erreur lors du chargement des articles");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply all filters and sorting
  const applyFilters = (
    allPosts: BlogPost[],
    query: string,
    category: string,
    status: string,
    sort: string,
    order: string
  ) => {
    let filtered = [...allPosts];
    
    // Apply search filter
    if (query) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (category && category !== "all") {
      filtered = filtered.filter((post) => post.category === category);
    }
    
    // Apply status filter
    if (status !== "all") {
      if (status === "scheduled") {
        // Handle scheduled posts (those with a future publishDate)
        const now = new Date();
        filtered = filtered.filter(
          (post) => 
            post.status === "draft" && 
            post.publishDate && 
            new Date(post.publishDate) > now
        );
      } else {
        filtered = filtered.filter((post) => post.status === status);
      }
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sort === "date") {
        return order === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sort === "title") {
        return order === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sort === "views") {
        return order === "asc"
          ? (a.viewCount || 0) - (b.viewCount || 0)
          : (b.viewCount || 0) - (a.viewCount || 0);
      }
      return 0;
    });
    
    setFilteredPosts(filtered);
  };

  // Update filters when any filter changes
  useEffect(() => {
    applyFilters(posts, searchQuery, selectedCategory, statusFilter, sortBy, sortOrder);
  }, [searchQuery, selectedCategory, statusFilter, sortBy, sortOrder]);

  // Handle filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as "all" | "published" | "draft" | "scheduled");
  };
  
  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-");
    setSortBy(newSortBy as "date" | "title" | "views");
    setSortOrder(newSortOrder as "asc" | "desc");
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setStatusFilter("all");
    setSortBy("date");
    setSortOrder("desc");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Handle delete post
  const handleDeleteClick = (postId: number) => {
    setDeletePostId(postId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletePostId === null) return;
    
    try {
      await blogService.deletePost(deletePostId);
      setPosts(posts.filter((post) => post.id !== deletePostId));
      setFilteredPosts(filteredPosts.filter((post) => post.id !== deletePostId));
      toast.success("Article supprimé avec succès");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erreur lors de la suppression de l'article");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletePostId(null);
    }
  };

  // Handle edit post
  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setIsFormDialogOpen(true);
  };

  // Handle add new post
  const handleAddPost = () => {
    setEditingPost(null);
    setIsFormDialogOpen(true);
  };

  // Handle save post
  const handleSavePost = async (post: BlogPost) => {
    try {
      if (editingPost) {
        // Update existing post
        const updatedPost = await blogService.updatePost(post.id, post);
        setPosts(posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
        toast.success("Article mis à jour avec succès");
      } else {
        // Create new post
        const newPost = await blogService.createPost(post);
        setPosts([...posts, newPost]);
        toast.success("Article créé avec succès");
      }
      
      setIsFormDialogOpen(false);
      
      // Refresh the posts list
      loadPosts();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Erreur lors de l'enregistrement de l'article");
    }
  };

  // Handle schedule post
  const handleScheduleClick = (post: BlogPost) => {
    setSchedulingPost(post);
    
    // Set default date and time (tomorrow at noon)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    
    setScheduledDate(tomorrow.toISOString().split("T")[0]);
    setScheduledTime("12:00");
    
    setIsScheduleDialogOpen(true);
  };

  const confirmSchedule = async () => {
    if (!schedulingPost) return;
    
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      if (isNaN(scheduledDateTime.getTime())) {
        toast.error("Date ou heure invalide");
        return;
      }
      
      // Update the post with the scheduled publish date
      const updatedPost = await blogService.updatePost(schedulingPost.id, {
        ...schedulingPost,
        publishDate: scheduledDateTime.toISOString(),
        status: "draft", // Keep as draft until publishing date
      });
      
      setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
      toast.success(`Article programmé pour le ${formatDate(scheduledDateTime.toISOString())}`);
      setIsScheduleDialogOpen(false);
      setSchedulingPost(null);
      
      // Refresh the posts list
      loadPosts();
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast.error("Erreur lors de la programmation de l'article");
    }
  };

  // Get appropriate badge for post status
  const getStatusBadge = (post: BlogPost) => {
    // Check if it's a scheduled post (draft with future publishDate)
    if (
      post.status === "draft" && 
      post.publishDate && 
      new Date(post.publishDate) > new Date()
    ) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Programmé
        </Badge>
      );
    }
    
    switch (post.status) {
      case "published":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Publié
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <FileText className="w-3 h-3 mr-1" />
            Brouillon
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {post.status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Blog</h1>
          <p className="text-muted-foreground">
            Créez, modifiez et gérez les articles de votre blog.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddPost}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("/blog", "_blank")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir le blog
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
                Tous
              </TabsTrigger>
              <TabsTrigger value="published" onClick={() => setStatusFilter("published")}>
                Publiés
              </TabsTrigger>
              <TabsTrigger value="drafts" onClick={() => setStatusFilter("draft")}>
                Brouillons
              </TabsTrigger>
              <TabsTrigger value="scheduled" onClick={() => setStatusFilter("scheduled")}>
                Programmés
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher un article..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              
              <div className="flex gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Plus récents</SelectItem>
                    <SelectItem value="date-asc">Plus anciens</SelectItem>
                    <SelectItem value="title-asc">Titre (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Titre (Z-A)</SelectItem>
                    <SelectItem value="views-desc">Plus vus</SelectItem>
                    <SelectItem value="views-asc">Moins vus</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetFilters}
                  title="Réinitialiser les filtres"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">Aucun article trouvé</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || selectedCategory !== "all" || statusFilter !== "all"
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Commencez par créer votre premier article de blog"}
              </p>
              <Button
                className="mt-4"
                onClick={searchQuery || selectedCategory !== "all" || statusFilter !== "all" ? resetFilters : handleAddPost}
              >
                {searchQuery || selectedCategory !== "all" || statusFilter !== "all" ? (
                  <>Réinitialiser les filtres</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un article
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Vues</TableHead>
                    <TableHead className="text-center">Commentaires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.category}</TableCell>
                      <TableCell>{getStatusBadge(post)}</TableCell>
                      <TableCell>{formatDate(post.date)}</TableCell>
                      <TableCell className="text-center">{post.viewCount || 0}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => navigate(`/admin/blog/comments?postId=${post.id}`)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.commentCount || 0}</span>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => window.open(`/blog/${post.id}`, "_blank")}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPost(post)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleScheduleClick(post)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Programmer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(post.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article et tous ses commentaires
              seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePostId(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "Modifier l'article" : "Nouvel article"}
            </DialogTitle>
          </DialogHeader>
          <BlogPostForm
            post={editingPost}
            onSubmit={handleSavePost}
            onCancel={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Programmer la publication</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date de publication
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Heure de publication
                </label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              {schedulingPost && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    L'article <strong>{schedulingPost.title}</strong> sera publié
                    automatiquement à la date et l'heure spécifiées.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsScheduleDialogOpen(false);
                setSchedulingPost(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={confirmSchedule}>
              Programmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogDashboard;