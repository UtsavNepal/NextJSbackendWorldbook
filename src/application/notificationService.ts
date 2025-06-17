import { notificationRepository } from '../infrastructure/repositories/notificationRepository';
import { Notification } from '../domain/notification';

function mapNotification(prismaNotification: any): Notification | null {
  if (!prismaNotification) return null;
  return {
    id: prismaNotification.id,
    recipientId: prismaNotification.recipientId,
    actorId: prismaNotification.actorId,
    notificationType: prismaNotification.notificationType,
    message: prismaNotification.message,
    relatedPostId: prismaNotification.relatedPostId,
    relatedCommentId: prismaNotification.relatedCommentId,
    isRead: prismaNotification.isRead,
    timestamp: prismaNotification.timestamp,
  };
}

export const notificationService = {
  async getNotificationById(id: string): Promise<Notification | null> {
    const notification = await notificationRepository.getNotificationById(id);
    return mapNotification(notification);
  },
  async createNotification(notification: Omit<Notification, 'id'>): Promise<Notification> {
    const created = await notificationRepository.createNotification(notification);
    return mapNotification(created)!;
  },
  async listNotifications(): Promise<Notification[]> {
    const notifications = await notificationRepository.listNotifications();
    return notifications.map(mapNotification).filter(Boolean) as Notification[];
  },
  async updateNotification(id: string, data: Partial<Notification>): Promise<Notification | null> {
    const updated = await notificationRepository.updateNotification(id, data);
    return mapNotification(updated);
  },
  async deleteNotification(id: string): Promise<void> {
    await notificationRepository.deleteNotification(id);
  },
};
