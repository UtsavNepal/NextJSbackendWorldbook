import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const messageRepository = {
  async getMessageById(id: string) {
    return prisma.message.findUnique({ where: { id } });
  },
  async createMessage(data: {
    conversationId: string;
    senderId: string;
    text?: string;
    imageUrl?: string;
    gifUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deleted?: boolean;
  }) {
    return prisma.message.create({ data });
  },
  async listMessages() {
    return prisma.message.findMany();
  },
  async updateMessage(id: string, data: any) {
    return prisma.message.update({ where: { id }, data });
  },
  async deleteMessage(id: string) {
    return prisma.message.delete({ where: { id } });
  },
}; 