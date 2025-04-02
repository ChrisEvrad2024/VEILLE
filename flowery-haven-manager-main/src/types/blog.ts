// src/types/blog.ts
export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  author: string;
  authorId?: string;
  date: string;
  category: string;
  tags?: string[];
  imageUrl?: string;
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
  publishDate?: string; // Date à laquelle publier automatiquement
}

export interface BlogComment {
  id?: number;
  postId: number;
  author: string;
  authorId?: string;
  authorEmail?: string;
  content: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  parentId?: number;
  reactions: CommentReaction[];
}

export interface CommentReaction {
  type: 'like' | 'love' | 'laugh';
  count: number;
  users: string[];
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
  color?: string;
  icon?: string;
}

export interface BlogTag {
  name: string;
  count: number;
}

export interface BlogStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  popularPosts: BlogPost[];
  recentComments: BlogComment[];
  categoriesDistribution: {
    category: string;
    count: number;
  }[];
}