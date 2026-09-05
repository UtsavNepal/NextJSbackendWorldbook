import { prisma } from '@/infrastructure/prisma';

export async function uniqueUsername(email: string) {
  const base = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
  let username = base;
  let suffix = 0;
  while (await prisma.profile.findUnique({ where: { username } })) {
    suffix += 1;
    username = `${base}${suffix}`;
  }
  return username;
}

export async function getProfileForUser(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    include: { user: true },
  });
}

export async function getViewerProfileId(userId?: string | null) {
  if (!userId) return null;
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

export async function resolveProfileId(id: string) {
  const byProfile = await prisma.profile.findUnique({ where: { id } });
  if (byProfile) return byProfile.id;
  const byUser = await prisma.profile.findUnique({ where: { userId: id } });
  return byUser?.id ?? null;
}

export type FriendshipStatus = {
  is_friend: boolean;
  friend_request_sent: boolean;
  friend_request_received: boolean;
  friend_request_id: string | null;
};

const emptyFriendshipStatus: FriendshipStatus = {
  is_friend: false,
  friend_request_sent: false,
  friend_request_received: false,
  friend_request_id: null,
};

export async function getFriendshipStatus(
  viewerUserId: string | null | undefined,
  targetUserId: string | null | undefined
): Promise<FriendshipStatus> {
  if (!viewerUserId || !targetUserId || viewerUserId === targetUserId) {
    return emptyFriendshipStatus;
  }
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: viewerUserId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: viewerUserId },
      ],
    },
  });
  if (friendship) {
    return { ...emptyFriendshipStatus, is_friend: true };
  }
  const pending = await prisma.friendRequest.findFirst({
    where: {
      status: 'pending',
      OR: [
        { fromUserId: viewerUserId, toUserId: targetUserId },
        { fromUserId: targetUserId, toUserId: viewerUserId },
      ],
    },
  });
  if (!pending) return emptyFriendshipStatus;
  return {
    is_friend: false,
    friend_request_sent: pending.fromUserId === viewerUserId,
    friend_request_received: pending.toUserId === viewerUserId,
    friend_request_id: pending.id,
  };
}

export async function getFriendshipStatuses(
  viewerUserId: string,
  targetUserIds: string[]
): Promise<Record<string, FriendshipStatus>> {
  const uniqueIds = [...new Set(targetUserIds.filter((id) => id && id !== viewerUserId))];
  const result: Record<string, FriendshipStatus> = {};
  uniqueIds.forEach((id) => {
    result[id] = { ...emptyFriendshipStatus };
  });
  if (!uniqueIds.length) return result;

  const [friendships, requests] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: viewerUserId, user2Id: { in: uniqueIds } },
          { user2Id: viewerUserId, user1Id: { in: uniqueIds } },
        ],
      },
    }),
    prisma.friendRequest.findMany({
      where: {
        status: 'pending',
        OR: [
          { fromUserId: viewerUserId, toUserId: { in: uniqueIds } },
          { fromUserId: { in: uniqueIds }, toUserId: viewerUserId },
        ],
      },
    }),
  ]);

  friendships.forEach((friendship) => {
    const otherId = friendship.user1Id === viewerUserId ? friendship.user2Id : friendship.user1Id;
    result[otherId] = { ...emptyFriendshipStatus, is_friend: true };
  });
  requests.forEach((request) => {
    const otherId = request.fromUserId === viewerUserId ? request.toUserId : request.fromUserId;
    if (result[otherId]?.is_friend) return;
    result[otherId] = {
      is_friend: false,
      friend_request_sent: request.fromUserId === viewerUserId,
      friend_request_received: request.toUserId === viewerUserId,
      friend_request_id: request.id,
    };
  });
  return result;
}

function notificationMatch(data: {
  recipientId: string;
  actorId: string;
  notificationType: string;
  relatedPostId?: string;
  relatedCommentId?: string;
}) {
  return {
    recipientId: data.recipientId,
    actorId: data.actorId,
    notificationType: data.notificationType,
    relatedPostId: data.relatedPostId ?? null,
    relatedCommentId: data.relatedCommentId ?? null,
  };
}

export async function notify(data: {
  recipientId: string;
  actorId: string;
  notificationType: string;
  message: string;
  relatedPostId?: string;
  relatedCommentId?: string;
}) {
  if (data.recipientId === data.actorId) return;
  const where = notificationMatch(data);
  const existing = await prisma.notification.findFirst({
    where,
    orderBy: { timestamp: 'desc' },
  });
  if (existing) {
    await prisma.notification.deleteMany({
      where: { ...where, id: { not: existing.id } },
    });
    await prisma.notification.update({
      where: { id: existing.id },
      data: {
        message: data.message,
        isRead: false,
        timestamp: new Date(),
      },
    });
    return;
  }
  await prisma.notification.create({
    data: {
      ...where,
      message: data.message,
      isRead: false,
    },
  });
}

export async function withdrawNotification(data: {
  recipientId: string;
  actorId: string;
  notificationType: string;
  relatedPostId?: string;
  relatedCommentId?: string;
}) {
  await prisma.notification.deleteMany({
    where: notificationMatch(data),
  });
}

export async function withdrawFriendRequestNotification(fromUserId: string, toUserId: string) {
  const actor = await getProfileForUser(fromUserId);
  const recipient = await getProfileForUser(toUserId);
  if (!actor || !recipient) return;
  await withdrawNotification({
    recipientId: recipient.id,
    actorId: actor.id,
    notificationType: 'friend_request',
  });
}

export async function pruneNotifications(profileId: string) {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: profileId },
    include: {
      actor: true,
      recipient: true,
      relatedPost: { include: { likes: { select: { id: true } } } },
    },
    orderBy: { timestamp: 'desc' },
  });
  if (!notifications.length) return;

  const recipientUserId = notifications[0].recipient?.userId;
  const pendingFrom = new Set(
    recipientUserId
      ? (
          await prisma.friendRequest.findMany({
            where: { toUserId: recipientUserId, status: 'pending' },
            select: { fromUserId: true },
          })
        ).map((request) => request.fromUserId)
      : []
  );
  const follows = new Set(
    (
      await prisma.follow.findMany({
        where: { followingId: profileId },
        select: { followerId: true },
      })
    ).map((follow) => follow.followerId)
  );

  const staleIds: string[] = [];
  const seen = new Set<string>();
  for (const notification of notifications) {
    const key = [
      notification.notificationType,
      notification.actorId,
      notification.relatedPostId ?? '',
      notification.relatedCommentId ?? '',
    ].join(':');
    if (['like', 'friend_request', 'follow'].includes(notification.notificationType)) {
      if (seen.has(key)) {
        staleIds.push(notification.id);
        continue;
      }
      seen.add(key);
    }
    if (notification.notificationType === 'like') {
      const stillLiked = notification.relatedPost?.likes.some((like) => like.id === notification.actorId);
      if (!stillLiked) staleIds.push(notification.id);
    }
    if (notification.notificationType === 'friend_request') {
      const actorUserId = notification.actor?.userId;
      if (!actorUserId || !pendingFrom.has(actorUserId)) staleIds.push(notification.id);
    }
    if (notification.notificationType === 'follow' && !follows.has(notification.actorId)) {
      staleIds.push(notification.id);
    }
    if (notification.notificationType === 'message_request') {
      const actorUserId = notification.actor?.userId;
      const recipientUserId = notification.recipient?.userId;
      if (!actorUserId || !recipientUserId) {
        staleIds.push(notification.id);
      }
    }
  }

  if (staleIds.length) {
    await prisma.notification.deleteMany({ where: { id: { in: staleIds } } });
  }
}
