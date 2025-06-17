export interface Comment {
  id: string;
  profileId: string;
  postId: string;
  comment: string;
  createdAt: Date;
  parentId: string | null;
} 