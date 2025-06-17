export interface Profile {
  id: string;
  userId: string;
  profilePicture: string | null;
  username: string;
  bio: string | null;
  totalPosts: number;
  totalFriends: number;
  createdAt: Date;
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