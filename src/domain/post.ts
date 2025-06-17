export interface Post {
  id: string;
  profileId: string;
  content: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  visibility: string;
  // taggedProfiles and likes can be added as needed
} 