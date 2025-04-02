// src/pages/BlogPostDetail.tsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BlogCommentForm from "@/components/blog/BlogCommentForm";
import BlogCommentList from "@/components/blog/BlogCommentList";
import RelatedPosts from "@/components/blog/RelatedPosts";
import {
  Calendar,
  User,
  Tag,
  ArrowLeft,
  MessageCircle,
  Share,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  CheckCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { blogService } from "@/services/blog.service";
import { BlogPost, BlogComment } from "@/types/blog";
import { toast } from "sonner";

const BlogPostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  useEffect(() => {
    // Reset scroll position when navigating to a new post
    window.scrollTo(0, 0);

    if (id) {
      loadPostData(parseInt(id));
    }
  }, [id]);

  // Load post data, comments and related posts
  const loadPostData = async (postId: number) => {
    setIsLoading(true);
    try {
      // Load the post
      const fetchedPost = await blogService.getPostById(postId);

      if (!fetchedPost) {
        setError("Article non trouvé");
        setIsLoading(false);
        return;
      }

      setPost(fetchedPost);
      document.title = `${fetchedPost.title} | Blog`;

      // Load comments
      const fetchedComments = await blogService.getCommentsByPostId(postId);
      setComments(fetchedComments);

      // Load related posts (from same category)
      if (fetchedPost.category) {
        const categoryPosts = await blogService.getPostsByCategory(
          parseInt(fetchedPost.category)
        );
        setRelatedPosts(
          categoryPosts
            .filter((p) => p.id !== fetchedPost.id) // Exclude current post
            .slice(0, 3) // Limit to 3 posts
        );
      }
    } catch (error) {
      console.error("Error loading post data:", error);
      setError("Une erreur est survenue lors du chargement de l'article");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle comment added (refresh comments)
  const handleCommentAdded = async () => {
    if (!id) return;

    try {
      const fetchedComments = await blogService.getCommentsByPostId(
        parseInt(id)
      );
      setComments(fetchedComments);

      toast.success("Commentaire ajouté avec succès", {
        description: "Votre commentaire sera visible après modération.",
      });
    } catch (error) {
      console.error("Error refreshing comments:", error);
    }
  };

  // Format date to French locale
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Handle back to blog
  const handleBackToBlog = () => {
    navigate("/blog");
  };

  // Handle social sharing
  const handleShare = (platform: "facebook" | "twitter" | "linkedin") => {
    if (!post) return;

    const url = window.location.href;
    const title = post.title;
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`;
        break;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  // Copy link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsLinkCopied(true);
    toast.success("Lien copié !");

    setTimeout(() => {
      setIsLinkCopied(false);
    }, 3000);
  };

  // Get category name from ID
  const getCategoryName = (categoryId: string) => {
    // This would normally come from a map of categories
    // For now just return the ID with first letter capitalized
    return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  };

  // Handle tag click
  const handleTagClick = (tag: string) => {
    navigate(`/blog?tag=${tag}`);
  };

  // If there's an error loading the post
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Article non trouvé</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={handleBackToBlog}>Retour au blog</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={handleBackToBlog}
            className="mb-6 flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Retour au blog
          </Button>

          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-[400px] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ) : post ? (
            <>
              {/* Post image */}
              {post.imageUrl && (
                <div className="rounded-lg overflow-hidden mb-8">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              )}

              {/* Post content */}
              <div className="mb-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge
                    variant="outline"
                    className="hover:bg-primary/10 cursor-pointer"
                    onClick={() => navigate(`/blog?category=${post.category}`)}
                  >
                    {getCategoryName(post.category)}
                  </Badge>
                </div>

                <h1 className="text-4xl font-serif mb-4">{post.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>{formatDate(post.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={16} />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={16} />
                    <span>{post.viewCount} vues</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={16} />
                    <span>{post.commentCount || 0} commentaires</span>
                  </div>
                </div>

                {/* Post excerpt */}
                {post.excerpt && (
                  <p className="text-lg font-medium mb-6">{post.excerpt}</p>
                )}

                {/* Post content */}
                <div className="prose prose-stone max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <Tag size={18} />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => handleTagClick(tag)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social sharing */}
              <div className="bg-muted/20 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium mb-4">
                  Partager cet article
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#3b5998] text-white hover:bg-[#3b5998]/90"
                    onClick={() => handleShare("facebook")}
                  >
                    <Facebook size={16} className="mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90"
                    onClick={() => handleShare("twitter")}
                  >
                    <Twitter size={16} className="mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90"
                    onClick={() => handleShare("linkedin")}
                  >
                    <Linkedin size={16} className="mr-2" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    {isLinkCopied ? (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Lien copié
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-2" />
                        Copier le lien
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xl font-medium mb-6">
                    Articles similaires
                  </h3>
                  <RelatedPosts posts={relatedPosts} />
                </div>
              )}

              {/* Comments section */}
              <Separator className="my-8" />
              <div className="mt-8">
                <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
                  <MessageCircle size={20} />
                  Commentaires ({comments.length})
                </h3>

                <BlogCommentList
                  comments={comments}
                  postId={post.id}
                  onCommentAdded={handleCommentAdded}
                />

                <BlogCommentForm
                  postId={post.id}
                  onCommentAdded={handleCommentAdded}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPostDetail;
