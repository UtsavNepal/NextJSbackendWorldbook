import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const followRepository = {
  async getFollowById(id: string) {
    return prisma.follow.findUnique({ where: { id } });
  },
  async createFollow(data: {
    followerId: string;
    followingId: string;
    createdAt?: Date;
  }) {
    return prisma.follow.create({ data });
  },
  async listFollows() {
    return prisma.follow.findMany();
  },
  async updateFollow(id: string, data: any) {
    return prisma.follow.update({ where: { id }, data });
  },
  async deleteFollow(id: string) {
    return prisma.follow.delete({ where: { id } });
  },
}; 