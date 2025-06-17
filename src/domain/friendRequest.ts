export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | string;

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date;
} 