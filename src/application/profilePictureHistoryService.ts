import { profilePictureHistoryRepository } from '../infrastructure/repositories/profilePictureHistoryRepository';
import { ProfilePictureHistory } from '../domain/profilePictureHistory';

function mapProfilePictureHistory(prismaPPH: any): ProfilePictureHistory | null {
  if (!prismaPPH) return null;
  return {
    id: prismaPPH.id,
    profileId: prismaPPH.profileId,
    profilePictureUrl: prismaPPH.profilePicture,
    updatedAt: prismaPPH.updatedAt,
  };
}

export const profilePictureHistoryService = {
  async getProfilePictureHistoryById(id: string): Promise<ProfilePictureHistory | null> {
    const pph = await profilePictureHistoryRepository.getProfilePictureHistoryById(id);
    return mapProfilePictureHistory(pph);
  },
  async createProfilePictureHistory(pph: Omit<ProfilePictureHistory, 'id'>): Promise<ProfilePictureHistory> {
    const created = await profilePictureHistoryRepository.createProfilePictureHistory({
      ...pph,
      profilePicture: pph.profilePictureUrl,
    });
    return mapProfilePictureHistory(created)!;
  },
  async listProfilePictureHistories(): Promise<ProfilePictureHistory[]> {
    const pphs = await profilePictureHistoryRepository.listProfilePictureHistories();
    return pphs.map(mapProfilePictureHistory).filter(Boolean) as ProfilePictureHistory[];
  },
  async updateProfilePictureHistory(id: string, data: Partial<ProfilePictureHistory>): Promise<ProfilePictureHistory | null> {
    const updated = await profilePictureHistoryRepository.updateProfilePictureHistory(id, data);
    return mapProfilePictureHistory(updated);
  },
  async deleteProfilePictureHistory(id: string): Promise<void> {
    await profilePictureHistoryRepository.deleteProfilePictureHistory(id);
  },
}; 