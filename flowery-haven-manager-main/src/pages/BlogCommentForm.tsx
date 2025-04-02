// src/components/blog/BlogCommentForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { blogService } from "@/services/blog.service";
import { authService } from "@/services/auth.service";
import { MessageCircle, User } from "lucide-react";

interface BlogCommentFormProps {
  postId: number;
  parentId?: number;
  onCommentAdded: () => void;
  onCancel?: () => void;
}

const BlogCommentForm = ({
  postId,
  parentId,
  onCommentAdded,
  onCancel,
}: BlogCommentFormProps) => {
  const currentUser = authService.getCurrentUser();
  const [name, setName] = useState(
    currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ""
  );
  const [email, setEmail] = useState(currentUser ? currentUser.email : "");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!content.trim()) {
      setError("Le commentaire ne peut pas être vide");
      return;
    }

    if (!currentUser && !name.trim()) {
      setError("Veuillez indiquer votre nom");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare comment data
      const commentData = {
        postId,
        parentId,
        author: name,
        authorEmail: email,
        content: content.trim(),
      };

      // Add the comment
      const success = await blogService.addComment(commentData);

      if (success) {
        // Reset form
        setContent("");

        // If not logged in, reset name and email (keep them if logged in)
        if (!currentUser) {
          setName("");
          setEmail("");
        }

        // Notify parent component
        onCommentAdded();
      } else {
        throw new Error("Failed to add comment");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Une erreur est survenue lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-8">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-lg">
              {parentId ? "Répondre au commentaire" : "Laisser un commentaire"}
            </h3>
          </div>

          {!currentUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email (facultatif)"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">
              Commentaire <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrivez votre commentaire ici..."
              rows={4}
              required
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi en cours..." : "Publier le commentaire"}
            </Button>
          </div>

          {!authService.isAdmin() && (
            <p className="text-xs text-muted-foreground mt-2">
              Votre commentaire sera visible après validation par un modérateur.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default BlogCommentForm;
