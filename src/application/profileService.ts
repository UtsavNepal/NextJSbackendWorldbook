import { profileRepository } from '../infrastructure/repositories/profileRepository';
import { Profile } from '../domain/profile';

function mapProfile(prismaProfile: any): Profile | null {
  if (!prismaProfile) return null;
  return {
    id: prismaProfile.id,
    userId: prismaProfile.userId,
    profilePicture: prismaProfile.profilePicture,
    username: prismaProfile.username,
    bio: prismaProfile.bio,
    totalPosts: prismaProfile.totalPosts,
    totalFriends: prismaProfile.totalFriends,
    createdAt: prismaProfile.createdAt,
  };
}

export const profileService = {
  async getProfileById(id: string): Promise<Profile | null> {
    const profile = await profileRepository.getProfileById(id);
    return mapProfile(profile);
  },
  async createProfile(profile: Omit<Profile, 'id'>): Promise<Profile> {
    const created = await profileRepository.createProfile({
      ...profile,
      profilePicture: profile.profilePicture ?? undefined,
      bio: profile.bio ?? undefined,
      totalPosts: profile.totalPosts ?? 0,
      totalFriends: profile.totalFriends ?? 0,
    });
    return mapProfile(created)!;
  },
  async listProfiles(): Promise<Profile[]> {
    const profiles = await profileRepository.listProfiles();
    return profiles.map(mapProfile).filter(Boolean) as Profile[];
  },
  async updateProfile(id: string, data: Partial<Profile>): Promise<Profile | null> {
    const updated = await profileRepository.updateProfile(id, data);
    return mapProfile(updated);
  },
  async deleteProfile(id: string): Promise<void> {
    await profileRepository.deleteProfile(id);
  },
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    const profile = await profileRepository.getProfileByUserId(userId);
    return mapProfile(profile);
  },
  async getPublicProfile(profileId: string): Promise<any> {
    // Return public info and mutual friends, post photos, etc.
    return profileRepository.getPublicProfile(profileId);
  },
  async getFollowers(profileId: string): Promise<Profile[]> {
    const followers = await profileRepository.getFollowers(profileId);
    return followers.map(mapProfile).filter(Boolean) as Profile[];
  },
  async getFollowing(profileId: string): Promise<Profile[]> {
    const following = await profileRepository.getFollowing(profileId);
    return following.map(mapProfile).filter(Boolean) as Profile[];
  },
  async followProfile(userId: string, profileId: string): Promise<any> {
    return profileRepository.followProfile(userId, profileId);
  },
  async unfollowProfile(userId: string, profileId: string): Promise<any> {
    return profileRepository.unfollowProfile(userId, profileId);
  },
};