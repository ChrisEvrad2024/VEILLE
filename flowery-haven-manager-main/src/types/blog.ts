// Types pour le blog
export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  author: string;
  authorId?: number;
  date: string;
  category: number;
  tags?: string[];
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id?: number;
  postId: number;
  author: string;
  authorId?: number;
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
  users: number[];
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}