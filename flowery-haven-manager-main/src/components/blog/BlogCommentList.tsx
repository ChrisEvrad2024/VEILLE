// src/components/blog/BlogCommentList.tsx
import { useState } from "react";
import { authService } from "@/services/auth.service";
import { BlogComment } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  MessageCircle,
  Reply,
  ThumbsUp,
  Heart,
  AlertCircle,
} from "lucide-react";
import BlogCommentForm from "./BlogCommentForm";

interface BlogCommentListProps {
  comments: BlogComment[];
  postId: number;
  onCommentAdded: () => void;
}

export default function BlogCommentList({
  comments,
  postId,
  onCommentAdded,
}: BlogCommentListProps) {
  const [replyToId, setReplyToId] = useState<number | null>(null);

  // Group comments by parent/child relationship
  const parentComments = comments.filter((comment) => !comment.parentId);
  const childComments = comments.filter((comment) => comment.parentId);

  // Get child comments for a specific parent
  const getChildComments = (parentId: number) => {
    return childComments.filter((comment) => comment.parentId === parentId);
  };

  // Format date as relative time
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get initials from author name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Toggle reply form
  const toggleReply = (commentId: number | null) => {
    setReplyToId(commentId === replyToId ? null : commentId);
  };

  // Handle reply added
  const handleReplyAdded = () => {
    setReplyToId(null);
    onCommentAdded();
  };

  if (comments.length === 0) {
    return (
      <div className="bg-muted/20 rounded-lg p-8 text-center mb-6">
        <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          Aucun commentaire pour le moment
        </h3>
        <p className="text-muted-foreground mb-4">
          Soyez le premier à commenter cet article
        </p>
      </div>
    );
  }

  // Render a single comment
  const renderComment = (comment: BlogComment, isChild = false) => (
    <div
      key={comment.id}
      className={`${
        isChild ? "ml-8 mt-4" : "mb-6 border-b pb-6"
      } last:border-0 last:mb-0 last:pb-0`}
    >
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 bg-primary/10">
          <AvatarFallback>{getInitials(comment.author)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-medium">{comment.author}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(comment.date)}
            </div>
          </div>

          <div className="mt-2 text-sm">{comment.content}</div>

          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => toggleReply(comment.id!)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Répondre
            </Button>
            {comment.reactions?.length > 0 &&
              comment.reactions.map((reaction) => (
                <Button
                  key={reaction.type}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                >
                  {reaction.type === "like" ? (
                    <ThumbsUp className="h-3 w-3 mr-1" />
                  ) : reaction.type === "love" ? (
                    <Heart className="h-3 w-3 mr-1" />
                  ) : (
                    <span className="mr-1">😄</span>
                  )}
                  {reaction.count}
                </Button>
              ))}
          </div>

          {/* Reply form */}
          {replyToId === comment.id && (
            <div className="mt-4">
              <BlogCommentForm
                postId={postId}
                parentId={comment.id}
                onCommentAdded={handleReplyAdded}
              />
            </div>
          )}
        </div>
      </div>

      {/* Render child comments */}
      {comment.id &&
        getChildComments(comment.id).map((childComment) =>
          renderComment(childComment, true)
        )}
    </div>
  );

  return (
    <div className="space-y-4 mb-8">
      {!authService.isAdmin() && (
        <Alert variant="info" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Les commentaires sont modérés avant d'être publiés. Votre
            commentaire sera visible après approbation.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {parentComments.map((comment) => renderComment(comment))}
      </div>
    </div>
  );
}
