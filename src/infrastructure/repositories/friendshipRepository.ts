import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const friendshipRepository = {
  async getFriendshipById(id: string) {
    return prisma.friendship.findUnique({ where: { id } });
  },
  async createFriendship(data: {
    user1Id: string;
    user2Id: string;
    createdAt?: Date;
  }) {
    return prisma.friendship.create({ data });
  },
  async listFriendships() {
    return prisma.friendship.findMany();
  },
  async updateFriendship(id: string, data: any) {
    return prisma.friendship.update({ where: { id }, data });
  },
  async deleteFriendship(id: string) {
    return prisma.friendship.delete({ where: { id } });
  },
}; 