import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export const notificationRepository = {
  async getNotificationById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  },
  async createNotification(data: {
    recipientId: string;
    actorId: string;
    notificationType: string;
    message: string;
    relatedPostId?: string;
    relatedCommentId?: string;
    isRead?: boolean;
    timestamp?: Date;
  }) {
    return prisma.notification.create({ data });
  },
  async listNotifications() {
    return prisma.notification.findMany();
  },
  async updateNotification(id: string, data: any) {
    return prisma.notification.update({ where: { id }, data });
  },
  async deleteNotification(id: string) {
    return prisma.notification.delete({ where: { id } });
  },
}; 