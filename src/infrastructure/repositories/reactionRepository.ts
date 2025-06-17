import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const reactionRepository = {
  async getReactionById(id: string) {
    return prisma.reaction.findUnique({ where: { id } });
  },
  async createReaction(data: {
    messageId: string;
    userId: string;
    emoji: string;
    createdAt?: Date;
  }) {
    return prisma.reaction.create({ data });
  },
  async listReactions() {
    return prisma.reaction.findMany();
  },
  async updateReaction(id: string, data: any) {
    return prisma.reaction.update({ where: { id }, data });
  },
  async deleteReaction(id: string) {
    return prisma.reaction.delete({ where: { id } });
  },
}; 