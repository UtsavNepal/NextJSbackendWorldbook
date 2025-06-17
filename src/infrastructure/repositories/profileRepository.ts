import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const profileRepository = {
  async getProfileById(id: string) {
    return prisma.profile.findUnique({ where: { id } });
  },
  async getProfileByUserId(userId: string) {
    return prisma.profile.findUnique({ where: { userId } });
  },
  async createProfile(data: {
    userId: string;
    profilePicture?: string;
    username: string;
    bio?: string;
    totalPosts?: number;
    totalFriends?: number;
  }) {
    return prisma.profile.create({ data });
  },
  async listProfiles() {
    return prisma.profile.findMany();
  },
  async updateProfile(id: string, data: any) {
    return prisma.profile.update({ where: { id }, data });
  },
  async deleteProfile(id: string) {
    return prisma.profile.delete({ where: { id } });
  },
};

export {};
