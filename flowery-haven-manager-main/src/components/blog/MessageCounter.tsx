import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { blogService } from "@/services/blog.service";
import { Badge } from "@/components/ui/badge";

interface MessageCounterProps {
  postId?: number; // Optional post ID to filter messages for a specific post
  refreshInterval?: number; // Refresh interval in milliseconds
  onClick?: () => void; // Optional click handler
}

const MessageCounter = ({
  postId,
  refreshInterval = 60000, // Default refresh every minute
  onClick,
}: MessageCounterProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadMessages = async () => {
    try {
      setIsLoading(true);
      
      let comments;
      if (postId) {
        // Get comments for a specific post
        comments = await blogService.getCommentsByPostId(postId);
      } else {
        // Get all comments
        comments = await blogService.getAllComments();
      }
      
      // Count unread (pending) comments
      const pendingComments = comments.filter(comment => comment.status === 'pending');
      setUnreadCount(pendingComments.length);
    } catch (error) {
      console.error("Error fetching unread comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnreadMessages();
    
    // Set up interval for periodic refresh
    const intervalId = setInterval(fetchUnreadMessages, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [postId, refreshInterval]);

  if (isLoading) {
    return (
      <Badge variant="outline" className="bg-muted">
        <MessageCircle className="h-3 w-3 mr-1 animate-pulse" />
        ...
      </Badge>
    );
  }

  if (unreadCount === 0) {
    return (
      <Badge variant="outline" className="bg-muted/50 text-muted-foreground cursor-pointer" onClick={onClick}>
        <MessageCircle className="h-3 w-3 mr-1" />
        0
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="animate-pulse cursor-pointer" onClick={onClick}>
      <MessageCircle className="h-3 w-3 mr-1" />
      {unreadCount}
    </Badge>
  );
};

export default MessageCounter;