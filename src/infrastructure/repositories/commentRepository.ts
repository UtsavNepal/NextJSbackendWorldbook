import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const commentRepository = {
  async getCommentById(id: string) {
    return prisma.comment.findUnique({ where: { id } });
  },
  async createComment(data: {
    profileId: string;
    postId: string;
    comment: string;
    parentId?: string;
  }) {
    return prisma.comment.create({ data });
  },
  async listComments() {
    return prisma.comment.findMany();
  },
  async updateComment(id: string, data: any) {
    return prisma.comment.update({ where: { id }, data });
  },
  async deleteComment(id: string) {
    return prisma.comment.delete({ where: { id } });
  },
  async listCommentsByPostId(postId: string) {
    return prisma.comment.findMany({ where: { postId } });
  },
}; 