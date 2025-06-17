import { friendRequestRepository } from '../infrastructure/repositories/friendRequestRepository';
import { FriendRequest } from '../domain/friendRequest';

function mapFriendRequest(prismaFR: any): FriendRequest | null {
  if (!prismaFR) return null;
  return {
    id: prismaFR.id,
    fromUserId: prismaFR.fromUserId,
    toUserId: prismaFR.toUserId,
    status: prismaFR.status,
    createdAt: prismaFR.createdAt,
  };
}

export const friendRequestService = {
  async getFriendRequestById(id: string): Promise<FriendRequest | null> {
    const fr = await friendRequestRepository.getFriendRequestById(id);
    return mapFriendRequest(fr);
  },
  async createFriendRequest(fr: Omit<FriendRequest, 'id'>): Promise<FriendRequest> {
    const created = await friendRequestRepository.createFriendRequest({
      ...fr,
      status: fr.status ?? 'pending',
    });
    return mapFriendRequest(created)!;
  },
  async listFriendRequests(): Promise<FriendRequest[]> {
    const frs = await friendRequestRepository.listFriendRequests();
    return frs.map(mapFriendRequest).filter(Boolean) as FriendRequest[];
  },
  async updateFriendRequest(id: string, data: Partial<FriendRequest>): Promise<FriendRequest | null> {
    const updated = await friendRequestRepository.updateFriendRequest(id, data);
    return mapFriendRequest(updated);
  },
  async deleteFriendRequest(id: string): Promise<void> {
    await friendRequestRepository.deleteFriendRequest(id);
  },
};
