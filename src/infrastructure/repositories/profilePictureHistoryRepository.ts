import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const profilePictureHistoryRepository = {
  async getProfilePictureHistoryById(id: string) {
    return prisma.profilePictureHistory.findUnique({ where: { id } });
  },
  async createProfilePictureHistory(data: {
    profileId: string;
    profilePicture: string;
    updatedAt?: Date;
  }) {
    return prisma.profilePictureHistory.create({ data });
  },
  async listProfilePictureHistories() {
    return prisma.profilePictureHistory.findMany();
  },
  async updateProfilePictureHistory(id: string, data: any) {
    return prisma.profilePictureHistory.update({ where: { id }, data });
  },
  async deleteProfilePictureHistory(id: string) {
    return prisma.profilePictureHistory.delete({ where: { id } });
  },
}; 