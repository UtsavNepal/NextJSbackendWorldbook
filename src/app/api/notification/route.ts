import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '../../../application/notificationService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const notification = await notificationService.getNotificationById(id);
    if (!notification) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    return NextResponse.json(notification);
  }
  // List all notifications if no id is provided
  const notifications = await notificationService.listNotifications();
  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.recipientId || !body.actorId || !body.notificationType || !body.message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const notification = await notificationService.createNotification({
      recipientId: body.recipientId,
      actorId: body.actorId,
      notificationType: body.notificationType,
      message: body.message,
      relatedPostId: body.relatedPostId,
      relatedCommentId: body.relatedCommentId,
      isRead: body.isRead ?? false,
      timestamp: new Date(),
    });
    return NextResponse.json(notification, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create notification' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await notificationService.updateNotification(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await notificationService.deleteNotification(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete notification' }, { status: 500 });
  }
} 