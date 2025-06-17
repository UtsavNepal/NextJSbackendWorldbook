import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const conversationRepository = {
  async getConversationById(id: string) {
    return prisma.conversation.findUnique({ where: { id } });
  },
  async createConversation(data: {
    name?: string;
    isGroup?: boolean;
    participantIds?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    return prisma.conversation.create({ data });
  },
  async listConversations() {
    return prisma.conversation.findMany();
  },
  async updateConversation(id: string, data: any) {
    return prisma.conversation.update({ where: { id }, data });
  },
  async deleteConversation(id: string) {
    return prisma.conversation.delete({ where: { id } });
  },
}; 