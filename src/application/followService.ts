import { followRepository } from '../infrastructure/repositories/followRepository';
import { Follow } from '../domain/follow';

function mapFollow(prismaFollow: any): Follow | null {
  if (!prismaFollow) return null;
  return {
    id: prismaFollow.id,
    followerId: prismaFollow.followerId,
    followingId: prismaFollow.followingId,
    createdAt: prismaFollow.createdAt,
  };
}

export const followService = {
  async getFollowById(id: string): Promise<Follow | null> {
    const follow = await followRepository.getFollowById(id);
    return mapFollow(follow);
  },
  async createFollow(follow: Omit<Follow, 'id'>): Promise<Follow> {
    const created = await followRepository.createFollow(follow);
    return mapFollow(created)!;
  },
  async listFollows(): Promise<Follow[]> {
    const follows = await followRepository.listFollows();
    return follows.map(mapFollow).filter(Boolean) as Follow[];
  },
  async updateFollow(id: string, data: Partial<Follow>): Promise<Follow | null> {
    const updated = await followRepository.updateFollow(id, data);
    return mapFollow(updated);
  },
  async deleteFollow(id: string): Promise<void> {
    await followRepository.deleteFollow(id);
  },
}; 