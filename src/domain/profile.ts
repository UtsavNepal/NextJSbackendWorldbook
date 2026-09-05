export interface Profile {
  id: string;
  userId: string;
  profilePicture: string | null;
  username: string;
  bio: string | null;
  totalPosts: number;
  totalFriends: number;
  coverPhoto?: string | null;
  createdAt?: Date;
}


export interface ProfileDTO {
  id: string;
  userId: string;
  username: string;
  profilePicture: string | null;
  bio: string | null;
  totalPosts: number;
  totalFriends: number;
}