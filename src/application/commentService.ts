import { commentRepository } from '../infrastructure/repositories/commentRepository';
import { Comment } from '../domain/comment';

function mapComment(prismaComment: any): Comment | null {
  if (!prismaComment) return null;
  return {
    id: prismaComment.id,
    profileId: prismaComment.profileId,
    postId: prismaComment.postId,
    comment: prismaComment.comment,
    createdAt: prismaComment.createdAt,
    parentId: prismaComment.parentId,
  };
}

export const commentService = {
  async getCommentById(id: string): Promise<Comment | null> {
    const comment = await commentRepository.getCommentById(id);
    return mapComment(comment);
  },
  async createComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const created = await commentRepository.createComment({
      ...comment,
      parentId: comment.parentId ?? undefined,
    });
    return mapComment(created)!;
  },
  async listComments(): Promise<Comment[]> {
    const comments = await commentRepository.listComments();
    return comments.map(mapComment).filter(Boolean) as Comment[];
  },
  async updateComment(id: string, data: Partial<Comment>): Promise<Comment | null> {
    const updated = await commentRepository.updateComment(id, data);
    return mapComment(updated);
  },
  async deleteComment(id: string): Promise<void> {
    await commentRepository.deleteComment(id);
  },
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const comments = await commentRepository.listCommentsByPostId(postId);
    return comments.map(mapComment).filter(Boolean) as Comment[];
  },
}; 