export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'like'
  | 'comment'
  | 'reply'
  | 'friend_post';

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  notificationType: NotificationType;
  message: string;
  relatedPostId?: string;
  relatedCommentId?: string;
  isRead: boolean;
  timestamp: Date;
} 