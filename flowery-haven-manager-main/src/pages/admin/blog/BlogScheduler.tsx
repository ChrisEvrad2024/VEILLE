// src/pages/admin/blog/BlogScheduler.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
  Calendar as CalendarIcon,
  Clock,
  RefreshCw,
  CheckCircle,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarDays,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { format, isFuture, parseISO, addDays, addHours, addMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { blogService } from "@/services/blog.service";
import { BlogPost } from "@/types/blog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const BlogScheduler = () => {
  const navigate = useNavigate();
  
  const [scheduledPosts, setScheduledPosts] = useState<BlogPost[]>([]);
  const [draftPosts, setDraftPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processScheduledPostsLoading, setProcessScheduledPostsLoading] = useState(false);
  
  // Dialog states
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [schedulingPost, setSchedulingPost] = useState<BlogPost | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  
  const [isPublishNowDialogOpen, setIsPublishNowDialogOpen] = useState(false);
  const [publishingPostId, setPublishingPostId] = useState<number | null>(null);
  
  // Quick schedule options
  const [isQuickScheduleDialogOpen, setIsQuickScheduleDialogOpen] = useState(false);
  const [quickScheduleOption, setQuickScheduleOption] = useState<string>("tomorrow-morning");
  
  // Load scheduled posts
  useEffect(() => {
    loadPosts();
  }, []);
  
  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const allPosts = await blogService.getAllPosts(true);
      
      // Filter for scheduled posts (drafts with a future publishDate)
      const now = new Date();
      const scheduled = allPosts.filter(post => 
        post.status === "draft" && 
        post.publishDate && 
        isFuture(parseISO(post.publishDate))
      ).sort((a, b) => 
        new Date(a.publishDate!).getTime() - new Date(b.publishDate!).getTime()
      );
      
      setScheduledPosts(scheduled);
      
      // Filter for drafts without a schedule
      const drafts = allPosts.filter(post => 
        post.status === "draft" && 
        (!post.publishDate || !isFuture(parseISO(post.publishDate)))
      );
      
      setDraftPosts(drafts);
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Erreur lors du chargement des articles");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process scheduled posts
  const processScheduledPosts = async () => {
    setProcessScheduledPostsLoading(true);
    try {
      const count = await blogService.processScheduledPosts();
      
      if (count > 0) {
        toast.success(`${count} article(s) publié(s) avec succès`);
      } else {
        toast.info("Aucun article à publier pour le moment");
      }
      
      // Refresh the posts list
      loadPosts();
    } catch (error) {
      console.error("Error processing scheduled posts:", error);
      toast.error("Erreur lors du traitement des articles programmés");
    } finally {
      setProcessScheduledPostsLoading(false);
    }
  };
  
  // Handle schedule dialog
  const openScheduleDialog = (post: BlogPost) => {
    setSchedulingPost(post);
    
    // Set default date and time (tomorrow at 9:00 AM)
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    setScheduledDate(format(tomorrow, "yyyy-MM-dd"));
    setScheduledTime("09:00");
    
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
      
      if (!isFuture(scheduledDateTime)) {
        toast.error("La date de publication doit être dans le futur");
        return;
      }
      
      // Update the post with the scheduled publish date
      const updatedPost = await blogService.updatePost(schedulingPost.id, {
        publishDate: scheduledDateTime.toISOString(),
      });
      
      toast.success(`Article programmé pour le ${format(scheduledDateTime, "dd MMMM yyyy à HH:mm", { locale: fr })}`);
      setIsScheduleDialogOpen(false);
      setSchedulingPost(null);
      
      // Refresh the posts list
      loadPosts();
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast.error("Erreur lors de la programmation de l'article");
    }
  };
  
  // Handle quick schedule
  const openQuickScheduleDialog = (post: BlogPost) => {
    setSchedulingPost(post);
    setQuickScheduleOption("tomorrow-morning");
    setIsQuickScheduleDialogOpen(true);
  };
  
  const getQuickScheduleDate = (option: string): Date => {
    const now = new Date();
    
    switch (option) {
      case "tomorrow-morning":
        return addDays(new Date(now.setHours(9, 0, 0, 0)), 1);
      case "tomorrow-afternoon":
        return addDays(new Date(now.setHours(15, 0, 0, 0)), 1);
      case "weekend":
        // Find the next Saturday
        const daysToSaturday = 6 - now.getDay();
        return addDays(new Date(now.setHours(10, 0, 0, 0)), daysToSaturday > 0 ? daysToSaturday : 7);
      case "next-week":
        // Next Monday
        const daysToMonday = (1 + 7 - now.getDay()) % 7 || 7;
        return addDays(new Date(now.setHours(9, 0, 0, 0)), daysToMonday);
      case "in-one-hour":
        return addHours(new Date(), 1);
      case "in-thirty-minutes":
        return addMinutes(new Date(), 30);
      default:
        return addDays(new Date(now.setHours(9, 0, 0, 0)), 1);
    }
  };
  
  const confirmQuickSchedule = async () => {
    if (!schedulingPost) return;
    
    try {
      const scheduledDateTime = getQuickScheduleDate(quickScheduleOption);
      
      // Update the post with the scheduled publish date
      const updatedPost = await blogService.updatePost(schedulingPost.id, {
        publishDate: scheduledDateTime.toISOString(),
      });
      
      toast.success(`Article programmé pour le ${format(scheduledDateTime, "dd MMMM yyyy à HH:mm", { locale: fr })}`);
      setIsQuickScheduleDialogOpen(false);
      setSchedulingPost(null);
      
      // Refresh the posts list
      loadPosts();
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast.error("Erreur lors de la programmation de l'article");
    }
  };
  
  // Handle cancel schedule
  const handleCancelSchedule = async (postId: number) => {
    try {
      // Update the post to remove the publishDate
      const updatedPost = await blogService.updatePost(postId, {
        publishDate: undefined,
      });
      
      toast.success("Publication programmée annulée");
      
      // Refresh the posts list
      loadPosts();
    } catch (error) {
      console.error("Error canceling schedule:", error);
      toast.error("Erreur lors de l'annulation de la programmation");
    }
  };
  
  // Handle delete post
  const openDeleteDialog = (postId: number) => {
    setDeletingPostId(postId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (deletingPostId === null) return;
    
    try {
      await blogService.deletePost(deletingPostId);
      
      toast.success("Article supprimé avec succès");
      setIsDeleteDialogOpen(false);
      setDeletingPostId(null);
      
      // Refresh the posts list
      loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erreur lors de la suppression de l'article");
    }
  };
  
  // Handle publish now
  const openPublishNowDialog = (postId: number) => {
    setPublishingPostId(postId);
    setIsPublishNowDialogOpen(true);
  };
  
  const confirmPublishNow = async () => {
    if (publishingPostId === null) return;
    
    try {
      await blogService.publishPost(publishingPostId, true);
      
      toast.success("Article publié avec succès");
      setIsPublishNowDialogOpen(false);
      setPublishingPostId(null);
      
      // Refresh the posts list
      loadPosts();
    } catch (error) {
      console.error("Error publishing post:", error);
      toast.error("Erreur lors de la publication de l'article");
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "HH:mm", { locale: fr });
    } catch (e) {
      return "";
    }
  };
  
  // Format full datetime for display
  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMMM yyyy à HH:mm", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  // Calculate time remaining
  const getTimeRemaining = (dateString: string) => {
    const now = new Date();
    const targetDate = parseISO(dateString);
    const diffTime = targetDate.getTime() - now.getTime();
    
    if (diffTime <= 0) {
      return "Planifié pour maintenant";
    }
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''} ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} heure${diffHours > 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planification des publications</h1>
          <p className="text-muted-foreground">
            Planifiez la publication automatique de vos articles de blog.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={processScheduledPosts}
            disabled={processScheduledPostsLoading}
          >
            {processScheduledPostsLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Publier les articles planifiés
          </Button>
          <Button
            variant="outline"
            onClick={loadPosts}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            onClick={() => navigate("/admin/blog")}
          >
            Tous les articles
          </Button>
        </div>
      </div>

      {/* Scheduled posts section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Articles programmés
          </CardTitle>
          <CardDescription>
            Articles qui seront publiés automatiquement à une date et heure spécifiques
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : scheduledPosts.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">Aucun article programmé</h3>
              <p className="text-muted-foreground mt-1">
                Vous n'avez pas planifié d'articles pour une publication future.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Date de publication</TableHead>
                    <TableHead>Temps restant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledPosts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {post.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(post.publishDate!)}</span>
                          <span className="text-xs text-muted-foreground">{formatTime(post.publishDate!)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {getTimeRemaining(post.publishDate!)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openScheduleDialog(post)}
                            title="Modifier la planification"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => openPublishNowDialog(post.id)}
                            title="Publier maintenant"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600"
                            onClick={() => handleCancelSchedule(post.id)}
                            title="Annuler la planification"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => openDeleteDialog(post.id)}
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
      
      {/* Draft posts section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Brouillons disponibles
          </CardTitle>
          <CardDescription>
            Articles en brouillon que vous pouvez programmer pour une publication future
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : draftPosts.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">Aucun brouillon disponible</h3>
              <p className="text-muted-foreground mt-1">
                Commencez par créer un article en brouillon.
              </p>
              <Button className="mt-4" onClick={() => navigate("/admin/blog")}>
                Gérer les articles
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftPosts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {post.title}
                      </TableCell>
                      <TableCell>
                        {formatDate(post.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => openScheduleDialog(post)}
                          >
                            <CalendarClock className="h-4 w-4 mr-2" />
                            Planifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => openQuickScheduleDialog(post)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Rapide
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-600"
                            onClick={() => openPublishNowDialog(post.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Publier
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

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Programmer la publication</DialogTitle>
            {schedulingPost && (
              <DialogDescription>
                Programmer la publication de l'article: {schedulingPost.title}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Date
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Heure
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
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
      
      {/* Quick Schedule Dialog */}
      <Dialog open={isQuickScheduleDialogOpen} onOpenChange={setIsQuickScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Programmation rapide</DialogTitle>
            {schedulingPost && (
              <DialogDescription>
                Choisissez quand publier l'article: {schedulingPost.title}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="py-4">
            <Select
              value={quickScheduleOption}
              onValueChange={setQuickScheduleOption}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tomorrow-morning">Demain matin (9h)</SelectItem>
                <SelectItem value="tomorrow-afternoon">Demain après-midi (15h)</SelectItem>
                <SelectItem value="weekend">Ce week-end (samedi 10h)</SelectItem>
                <SelectItem value="next-week">Semaine prochaine (lundi 9h)</SelectItem>
                <SelectItem value="in-one-hour">Dans 1 heure</SelectItem>
                <SelectItem value="in-thirty-minutes">Dans 30 minutes</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm">
                L'article sera publié : 
                <span className="font-medium block mt-1">
                  {formatDateTime(getQuickScheduleDate(quickScheduleOption).toISOString())}
                </span>
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsQuickScheduleDialogOpen(false);
                setSchedulingPost(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={confirmQuickSchedule}>
              Programmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer cet article ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article et sa programmation
              seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPostId(null)}>
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
      
      {/* Publish Now Confirmation Dialog */}
      <AlertDialog
        open={isPublishNowDialogOpen}
        onOpenChange={setIsPublishNowDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Publier maintenant ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              L'article sera immédiatement publié et visible par tous les visiteurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPublishingPostId(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublishNow}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Publier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogScheduler;