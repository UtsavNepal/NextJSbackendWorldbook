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
  async acceptFriendRequest(userId: string, requestId: string) {
    // Set status to 'accepted' and create Friendship
    const req = await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'accepted' } });
    await prisma.friendship.create({ data: { user1Id: req.fromUserId, user2Id: req.toUserId } });
    return { message: 'Friend request accepted' };
  },
  async rejectFriendRequest(userId: string, requestId: string) {
    await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'rejected' } });
    return { message: 'Friend request rejected' };
  },
  async cancelFriendRequest(userId: string, requestId: string) {
    await prisma.friendRequest.delete({ where: { id: requestId } });
    return { message: 'Friend request cancelled' };
  },
  async listFriends(userId: string) {
    // Find all friendships where user is user1 or user2
    const friendships = await prisma.friendship.findMany({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } });
    const friendIds = friendships.map(f => f.user1Id === userId ? f.user2Id : f.user1Id);
    return prisma.user.findMany({ where: { id: { in: friendIds } } });
  },
  async deleteFriend(userId: string, friendId: string) {
    await prisma.friendship.deleteMany({ where: { OR: [ { user1Id: userId, user2Id: friendId }, { user1Id: friendId, user2Id: userId } ] } });
    return { message: 'Friend deleted' };
  },
}; 