// src/components/blog/RelatedPosts.tsx
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlogPost } from "@/types/blog";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface RelatedPostsProps {
  posts: BlogPost[];
}

const RelatedPosts = ({ posts }: RelatedPostsProps) => {
  const navigate = useNavigate();

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Handle click on a post
  const handlePostClick = (postId: number) => {
    navigate(`/blog/${postId}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden h-full flex flex-col">
          {post.imageUrl && (
            <div className="h-40 overflow-hidden">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          <CardContent className="flex-grow pt-6">
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <Calendar size={12} className="mr-1" />
              {formatDate(post.date)}
            </div>

            <h4 className="font-medium line-clamp-2 mb-2">{post.title}</h4>

            {post.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
            )}
          </CardContent>

          <CardFooter className="pt-0">
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => handlePostClick(post.id)}
            >
              Lire l'article
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default RelatedPosts;
