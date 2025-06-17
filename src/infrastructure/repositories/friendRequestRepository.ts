import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const friendRequestRepository = {
  async getFriendRequestById(id: string) {
    return prisma.friendRequest.findUnique({ where: { id } });
  },
  async createFriendRequest(data: {
    fromUserId: string;
    toUserId: string;
    status?: string;
  }) {
    return prisma.friendRequest.create({ data });
  },
  async listFriendRequests() {
    return prisma.friendRequest.findMany();
  },
  async updateFriendRequest(id: string, data: any) {
    return prisma.friendRequest.update({ where: { id }, data });
  },
  async deleteFriendRequest(id: string) {
    return prisma.friendRequest.delete({ where: { id } });
  },
}; 