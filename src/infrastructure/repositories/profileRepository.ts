import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const profileRepository = {
  async getProfileById(id: string) {
    return prisma.profile.findUnique({ where: { id } });
  },
  async getProfileByUserId(userId: string) {
    return prisma.profile.findUnique({ where: { userId } });
  },
  async getPublicProfile(profileId: string) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId }, include: { user: true, posts: true, followers: true, following: true } });
    return profile;
  },
  async getFollowers(profileId: string) {
    const followers = await prisma.follow.findMany({ where: { followingId: profileId }, include: { follower: true } });
    return followers.map(f => f.follower);
  },
  async getFollowing(profileId: string) {
    const following = await prisma.follow.findMany({ where: { followerId: profileId }, include: { following: true } });
    return following.map(f => f.following);
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
  async followProfile(userId: string, profileId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return { error: 'Profile not found' };
    if (profile.id === profileId) return { error: 'Cannot follow yourself' };
    await prisma.follow.create({ data: { followerId: profile.id, followingId: profileId } });
    return { message: 'Followed successfully' };
  },
  async unfollowProfile(userId: string, profileId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return { error: 'Profile not found' };
    await prisma.follow.deleteMany({ where: { followerId: profile.id, followingId: profileId } });
    return { message: 'Unfollowed successfully' };
  },
};

export {};
