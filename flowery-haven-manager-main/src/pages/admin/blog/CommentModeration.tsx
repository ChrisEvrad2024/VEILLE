// src/pages/admin/blog/CommentModeration.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2,
  MessageCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { blogService } from "@/services/blog.service";
import { BlogComment, BlogPost } from "@/types/blog";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const CommentModeration = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<BlogComment[]>([]);
  const [posts, setPosts] = useState<{ [id: number]: BlogPost }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    "pending"
  );
  const [postFilter, setPostFilter] = useState<string>("all");
  
  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingComment, setViewingComment] = useState<BlogComment | null>(null);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<BlogComment | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Load initial data
  useEffect(() => {
    loadComments();
  }, []);
  
  // Check if there's a postId in URL params
  useEffect(() => {
    const postId = searchParams.get("postId");
    if (postId) {
      setPostFilter(postId);
    }
  }, [searchParams]);
  
  // Apply filters whenever they change
  useEffect(() => {
    applyFilters(comments, searchQuery, statusFilter, postFilter);
  }, [comments, searchQuery, statusFilter, postFilter]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      // Get all comments
      const allComments = await blogService.getAllComments();
      setComments(allComments);
      
      // Load post info for each unique postId
      const postIds = Array.from(new Set(allComments.map((comment) => comment.postId)));
      const postsData: { [id: number]: BlogPost } = {};
      
      for (const postId of postIds) {
        const post = await blogService.getPostById(postId);
        if (post) {
          postsData[postId] = post;
        }
      }
      
      setPosts(postsData);
      
      // Apply initial filters
      applyFilters(allComments, searchQuery, statusFilter, postFilter);
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Erreur lors du chargement des commentaires");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply all filters
  const applyFilters = (
    allComments: BlogComment[],
    query: string,
    status: string,
    postId: string
  ) => {
    let filtered = [...allComments];
    
    // Apply search filter
    if (query) {
      filtered = filtered.filter(
        (comment) =>
          comment.author.toLowerCase().includes(query.toLowerCase()) ||
          comment.content.toLowerCase().includes(query.toLowerCase()) ||
          (comment.authorEmail && comment.authorEmail.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter((comment) => comment.status === status);
    }
    
    // Apply post filter
    if (postId && postId !== "all") {
      filtered = filtered.filter((comment) => comment.postId.toString() === postId);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredComments(filtered);
  };

  // Handle filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as "all" | "pending" | "approved" | "rejected");
  };
  
  const handlePostChange = (value: string) => {
    setPostFilter(value);
    
    // Update URL if a specific post is selected
    if (value !== "all") {
      setSearchParams({ postId: value });
    } else {
      setSearchParams({});
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("pending");
    setPostFilter("all");
    setSearchParams({});
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Handle approve comment
  const handleApprove = async (commentId: number) => {
    try {
      await blogService.approveComment(commentId);
      
      // Update local state
      setComments(
        comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, status: "approved" }
            : comment
        )
      );
      
      toast.success("Commentaire approuvé");
    } catch (error) {
      console.error("Error approving comment:", error);
      toast.error("Erreur lors de l'approbation du commentaire");
    }
  };

  // Handle reject comment
  const handleReject = async (commentId: number) => {
    try {
      await blogService.rejectComment(commentId);
      
      // Update local state
      setComments(
        comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, status: "rejected" }
            : comment
        )
      );
      
      toast.success("Commentaire rejeté");
    } catch (error) {
      console.error("Error rejecting comment:", error);
      toast.error("Erreur lors du rejet du commentaire");
    }
  };

  // Handle delete comment
  const handleDeleteClick = (commentId: number) => {
    setDeleteCommentId(commentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteCommentId === null) return;
    
    try {
      const success = await blogService.deleteComment(deleteCommentId);
      
      if (success) {
        // Update local state
        setComments(comments.filter((comment) => comment.id !== deleteCommentId));
        toast.success("Commentaire supprimé");
      } else {
        throw new Error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erreur lors de la suppression du commentaire");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteCommentId(null);
    }
  };

  // Handle view comment details
  const handleViewComment = (comment: BlogComment) => {
    setViewingComment(comment);
    setIsViewDialogOpen(true);
  };

  // Handle reply to comment
  const handleReplyClick = (comment: BlogComment) => {
    setReplyingToComment(comment);
    setReplyContent("");
    setIsReplyDialogOpen(true);
  };

  const submitReply = async () => {
    if (!replyingToComment || !replyContent.trim()) return;
    
    try {
      const postId = replyingToComment.postId;
      const parentId = replyingToComment.id;
      
      // Use the blog service to add a reply
      const newComment = await blogService.addComment({
        postId,
        parentId,
        author: "Admin",
        content: replyContent,
        // The status will be set to "approved" automatically for admin
      });
      
      if (newComment) {
        // Update local state to include the new comment
        setComments([...comments, newComment]);
        toast.success("Réponse publiée avec succès");
      }
      
      setIsReplyDialogOpen(false);
      setReplyingToComment(null);
      setReplyContent("");
      
      // Refresh the comments list
      loadComments();
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Erreur lors de l'ajout de la réponse");
    }
  };

  // Get badge for comment status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Get post title by id
  const getPostTitle = (postId: number) => {
    return posts[postId]?.title || `Article #${postId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modération des commentaires</h1>
          <p className="text-muted-foreground">
            Gérez les commentaires des utilisateurs sur vos articles de blog.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadComments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" onClick={() => handleStatusChange("all")}>
                Tous
              </TabsTrigger>
              <TabsTrigger value="pending" onClick={() => handleStatusChange("pending")}>
                En attente
              </TabsTrigger>
              <TabsTrigger value="approved" onClick={() => handleStatusChange("approved")}>
                Approuvés
              </TabsTrigger>
              <TabsTrigger value="rejected" onClick={() => handleStatusChange("rejected")}>
                Rejetés
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher dans les commentaires..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              
              <div className="flex-shrink-0">
                <Select
                  value={postFilter}
                  onValueChange={handlePostChange}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Tous les articles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les articles</SelectItem>
                    {Object.entries(posts).map(([id, post]) => (
                      <SelectItem key={id} value={id}>
                        {post.title.substring(0, 30)}
                        {post.title.length > 30 ? "..." : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">Aucun commentaire trouvé</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" || postFilter !== "all"
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Vous n'avez pas encore de commentaires"}
              </p>
              {(searchQuery || statusFilter !== "all" || postFilter !== "all") && (
                <Button
                  className="mt-4"
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auteur</TableHead>
                    <TableHead>Commentaire</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment.id} className={
                      comment.status === "pending" ? "bg-yellow-50" : ""
                    }>
                      <TableCell>
                        <div className="font-medium">{comment.author}</div>
                        {comment.authorEmail && (
                          <div className="text-xs text-muted-foreground">
                            {comment.authorEmail}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px] truncate">
                          {comment.content}
                        </div>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs"
                          onClick={() => handleViewComment(comment)}
                        >
                          Voir le texte complet
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="truncate max-w-[150px]">
                            {getPostTitle(comment.postId)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={() => window.open(`/blog/${comment.postId}`, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(comment.date)}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(comment.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {comment.status !== "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleApprove(comment.id!)}
                              title="Approuver"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {comment.status !== "rejected" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600"
                              onClick={() => handleReject(comment.id!)}
                              title="Rejeter"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleReplyClick(comment)}
                            title="Répondre"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteClick(comment.id!)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
              Cette action est irréversible. Le commentaire sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCommentId(null)}>
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

      {/* View Comment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Détails du commentaire</DialogTitle>
          </DialogHeader>
          
          {viewingComment && (
            <div className="py-4">
              <div className="flex justify-between mb-2">
                <div className="font-medium">{viewingComment.author}</div>
                <div>{getStatusBadge(viewingComment.status)}</div>
              </div>
              
              {viewingComment.authorEmail && (
                <div className="text-sm text-muted-foreground mb-2">
                  {viewingComment.authorEmail}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground mb-4">
                {formatDate(viewingComment.date)} • Article: {getPostTitle(viewingComment.postId)}
              </div>
              
              <Separator className="my-4" />
              
              <div className="bg-muted/50 p-4 rounded-md">
                {viewingComment.content}
              </div>
              
              {viewingComment.parentId && (
                <div className="mt-4 text-sm">
                  <span className="text-muted-foreground">En réponse à un autre commentaire</span>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Fermer
            </Button>
            {viewingComment && (
              <>
                {viewingComment.status !== "approved" && (
                  <Button
                    variant="outline"
                    className="text-green-600"
                    onClick={() => {
                      handleApprove(viewingComment.id!);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleReplyClick(viewingComment);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Répondre
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Répondre au commentaire</DialogTitle>
            {replyingToComment && (
              <DialogDescription>
                Répondre à {replyingToComment.author}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {replyingToComment && (
            <div className="py-4">
              <div className="bg-muted/50 p-4 rounded-md mb-4 text-sm">
                <p className="font-medium mb-1">{replyingToComment.author} a écrit :</p>
                {replyingToComment.content}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Votre réponse
                  </label>
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Écrivez votre réponse ici..."
                    rows={5}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReplyDialogOpen(false);
                setReplyingToComment(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={submitReply}
              disabled={!replyContent.trim()}
            >
              Publier la réponse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentModeration;