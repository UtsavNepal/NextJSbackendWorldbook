import { friendshipRepository } from '../infrastructure/repositories/friendshipRepository';
import { Friendship } from '../domain/friendship';

function mapFriendship(prismaFS: any): Friendship | null {
  if (!prismaFS) return null;
  return {
    id: prismaFS.id,
    user1Id: prismaFS.user1Id,
    user2Id: prismaFS.user2Id,
    createdAt: prismaFS.createdAt,
  };
}

export const friendshipService = {
  async getFriendshipById(id: string): Promise<Friendship | null> {
    const fs = await friendshipRepository.getFriendshipById(id);
    return mapFriendship(fs);
  },
  async createFriendship(fs: Omit<Friendship, 'id'>): Promise<Friendship> {
    const created = await friendshipRepository.createFriendship(fs);
    return mapFriendship(created)!;
  },
  async listFriendships(): Promise<Friendship[]> {
    const fss = await friendshipRepository.listFriendships();
    return fss.map(mapFriendship).filter(Boolean) as Friendship[];
  },
  async updateFriendship(id: string, data: Partial<Friendship>): Promise<Friendship | null> {
    const updated = await friendshipRepository.updateFriendship(id, data);
    return mapFriendship(updated);
  },
  async deleteFriendship(id: string): Promise<void> {
    await friendshipRepository.deleteFriendship(id);
  },
}; 