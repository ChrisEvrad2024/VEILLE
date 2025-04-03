import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { dbService } from "@/services/db.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X, Plus, Mail, MessageCircle } from "lucide-react";
import { blogService } from "@/services/blog.service";
import ImageUploader from "@/components/admin/ImageUploader";
import { Badge } from "@/components/ui/badge";

// Blog post interface
export interface BlogPost {
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
  commentCount?: number;
  unreadCommentCount?: number;
}

// Form validation schema
const blogPostFormSchema = z.object({
  title: z.string().min(5, {
    message: "Le titre doit contenir au moins 5 caractères",
  }),
  excerpt: z.string().min(20, {
    message: "Le résumé doit contenir au moins 20 caractères",
  }),
  content: z.string().min(50, {
    message: "Le contenu doit contenir au moins 50 caractères",
  }),
  authorName: z.string().min(3, {
    message: "Le nom de l'auteur doit contenir au moins 3 caractères",
  }),
  category: z.string({
    required_error: "Veuillez sélectionner une catégorie",
  }),
  status: z.enum(["draft", "published"], {
    required_error: "Veuillez sélectionner un statut",
  }),
});

type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;

interface BlogPostFormProps {
  post: BlogPost | null;
  onSubmit: (post: BlogPost) => void;
  onCancel: () => void;
}

export function BlogPostForm({ post, onSubmit, onCancel }: BlogPostFormProps) {
  const [imageUrl, setImageUrl] = useState(post?.imageUrl || "");
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [unreadComments, setUnreadComments] = useState<number>(post?.unreadCommentCount || 0);
  const [totalComments, setTotalComments] = useState<number>(post?.commentCount || 0);

  // Setup form with default values
  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      title: post?.title || "",
      excerpt: post?.excerpt || "",
      content: post?.content || "",
      authorName: post?.authorName || "",
      category: post?.category || "",
      status: post?.status || "draft",
    },
  });

  // Load comments count if editing an existing post
  useEffect(() => {
    const loadCommentsInfo = async () => {
      if (post?.id) {
        try {
          const comments = await blogService.getCommentsByPostId(parseInt(post.id));
          setTotalComments(comments.length);
          
          // Count unread comments (assuming pending status means unread)
          const unread = comments.filter(comment => comment.status === 'pending').length;
          setUnreadComments(unread);
        } catch (error) {
          console.error("Error loading comments info:", error);
        }
      }
    };

    loadCommentsInfo();
  }, [post?.id]);

  // Form submission handler
  const handleFormSubmit = (values: BlogPostFormValues) => {
    // Create new post object
    const updatedPost: BlogPost = {
      id: post?.id || `post-${Date.now()}`,
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
      authorId: post?.authorId || `auth-${Date.now()}`,
      authorName: values.authorName,
      publishDate: post?.publishDate || new Date(),
      status: values.status,
      imageUrl: imageUrl || "/assets/logo.jpeg", // Set default image if none is provided
      category: values.category,
      tags: tags,
      commentCount: post?.commentCount || 0,
      unreadCommentCount: post?.unreadCommentCount || 0
    };

    onSubmit(updatedPost);
  };

  // Add tag to the list
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  // Remove tag from the list
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Handle image URL change
  const handleImageChange = (url: string) => {
    setImageUrl(url);
  };

  // Categories
  const blogCategories = [
    "Conseils d'entretien",
    "Mariages",
    "Saisons",
    "Art floral",
    "Nouveautés",
    "Événements",
    "Plantes d'intérieur",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre de l'article</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre accrocheur de l'article" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {blogCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auteur</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'auteur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image uploader component */}
            <ImageUploader 
              imageUrl={imageUrl} 
              onImageChange={handleImageChange}
              defaultImage="/assets/logo.jpeg"
            />

            {/* Message count display (only for editing) */}
            {post?.id && (
              <div className="mt-4 p-3 bg-muted rounded-md flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Commentaires: {totalComments}</span>
                </div>
                
                {unreadComments > 0 && (
                  <div className="flex items-center">
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {unreadComments} non lu{unreadComments > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Résumé</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Un bref résumé de l'article..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contenu détaillé de l'article..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Ajouter un tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <div key={index} className="flex items-center space-x-1 bg-muted text-muted-foreground px-2 py-1 rounded-md">
                    <span>{tag}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {post ? "Mettre à jour" : "Créer l'article"}
          </Button>
        </div>
      </form>
    </Form>
  );
}