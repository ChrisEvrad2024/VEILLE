import { BlogPost, BlogComment, BlogCommentReaction } from "@/types/blog";

// Sample blog posts data - in a real app this would come from an API
export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Les tendances florales de l'automne",
    excerpt: "Découvrez les arrangements floraux qui feront sensation cette saison.",
    content: "L'automne est une saison magique pour les compositions florales. Avec ses couleurs chaudes et ses textures riches, cette période offre une palette somptueuse pour créer des arrangements uniques. Les tons ambrés, les rouges profonds et les oranges chaleureux dominent désormais nos créations. N'hésitez pas à intégrer des éléments naturels comme des branches, des baies, ou même des petites citrouilles décoratives pour un effet saisonnier parfait. Les chrysanthèmes, dahlias et roses d'automne sont particulièrement à l'honneur cette année.",
    date: "15 octobre 2023",
    author: "Sophie Martin",
    category: "tendances",
    imageUrl: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=2070&auto=format&fit=crop",
    tags: ["automne", "tendances", "décoration"],
    comments: [
      {
        id: 1,
        postId: 1,
        author: "Marie Dupont",
        content: "Superbe article ! J'adore les compositions avec des chrysanthèmes.",
        date: "16 octobre 2023"
      },
      {
        id: 2,
        postId: 1,
        author: "Paul Renard",
        content: "Merci pour ces conseils, je vais essayer d'incorporer plus d'éléments naturels dans mes compositions.",
        date: "17 octobre 2023"
      }
    ],
    featured: true
  }
];

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts;
}

export function getBlogPostById(id: number): BlogPost | undefined {
  const post = blogPosts.find(post => post.id === id);
  
  // Increment view count when a post is accessed
  if (post) {
    post.viewCount = (post.viewCount || 0) + 1;
  }
  
  return post;
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(post => post.category === category);
}

export function getRecentBlogPosts(count: number = 3): BlogPost[] {
  return [...blogPosts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}

export function getPopularBlogPosts(count: number = 3): BlogPost[] {
  return [...blogPosts]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, count);
}

export function getFeaturedBlogPosts(count: number = 3): BlogPost[] {
  return [...blogPosts]
    .filter(post => post.featured)
    .slice(0, count);
}

export function searchBlogPosts(query: string): BlogPost[] {
  const lowercaseQuery = query.toLowerCase();
  return blogPosts.filter(post => 
    post.title.toLowerCase().includes(lowercaseQuery) || 
    post.excerpt.toLowerCase().includes(lowercaseQuery) || 
    post.content?.toLowerCase().includes(lowercaseQuery) ||
    post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getBlogPostsByTag(tag: string): BlogPost[] {
  return blogPosts.filter(post => 
    post.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getAllTags(): string[] {
  const tagsSet = new Set<string>();
  
  blogPosts.forEach(post => {
    post.tags?.forEach(tag => {
      tagsSet.add(tag.toLowerCase());
    });
  });
  
  return Array.from(tagsSet);
}

export function sortBlogPosts(posts: BlogPost[], sortBy: 'date' | 'popularity' | 'title'): BlogPost[] {
  const sortedPosts = [...posts];
  
  switch (sortBy) {
    case 'date':
      return sortedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    case 'popularity':
      return sortedPosts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    case 'title':
      return sortedPosts.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sortedPosts;
  }
}

// Comments functions
export function getCommentsForPost(postId: number): BlogComment[] {
  const post = getBlogPostById(postId);
  
  // Get only top-level comments (no parentId)
  const comments = post?.comments?.filter(comment => !comment.parentId) || [];
  
  // Add replies to each comment
  comments.forEach(comment => {
    comment.replies = post?.comments?.filter(reply => reply.parentId === comment.id) || [];
  });
  
  return comments;
}

export function addCommentToPost(
  postId: number, 
  author: string, 
  content: string, 
  parentId?: number,
  email?: string
): BlogComment | null {
  const post = blogPosts.find(p => p.id === postId);
  
  if (!post) return null;
  
  if (!post.comments) {
    post.comments = [];
  }
  
  const newComment: BlogComment = {
    id: Date.now(),
    postId,
    author,
    content,
    date: new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    parentId,
    email,
    reactions: [
      { type: 'like', count: 0 },
      { type: 'love', count: 0 },
      { type: 'laugh', count: 0 }
    ]
  };
  
  post.comments.push(newComment);
  return newComment;
}

export function addReactionToComment(
  postId: number,
  commentId: number,
  reactionType: "like" | "love" | "laugh"
): boolean {
  const post = blogPosts.find(p => p.id === postId);
  if (!post || !post.comments) return false;
  
  const comment = post.comments.find(c => c.id === commentId);
  if (!comment) return false;
  
  if (!comment.reactions) {
    comment.reactions = [
      { type: 'like', count: 0 },
      { type: 'love', count: 0 },
      { type: 'laugh', count: 0 }
    ];
  }
  
  const reaction = comment.reactions.find(r => r.type === reactionType);
  if (reaction) {
    reaction.count += 1;
    return true;
  }
  
  return false;
}
