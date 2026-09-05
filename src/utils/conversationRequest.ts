import { prisma } from '@/infrastructure/prisma';
import { getProfileForUser, notify, withdrawNotification } from './social';

export async function areFriends(userIdA: string, userIdB: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: userIdA, user2Id: userIdB },
        { user1Id: userIdB, user2Id: userIdA },
      ],
    },
    select: { id: true },
  });
  return Boolean(friendship);
}

export async function requestFieldsForNewConversation(
  participantIds: string[],
  creatorId: string,
  isGroup: boolean
) {
  if (isGroup || participantIds.length !== 2) {
    return { requestStatus: 'accepted', requestedById: null as string | null };
  }
  const otherId = participantIds.find((id) => id !== creatorId);
  if (!otherId || await areFriends(creatorId, otherId)) {
    return { requestStatus: 'accepted', requestedById: null as string | null };
  }
  return { requestStatus: 'pending', requestedById: creatorId };
}

export async function acceptPendingBetween(userA: string, userB: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      isGroup: false,
      requestStatus: 'pending',
      AND: [
        { participants: { some: { id: userA } } },
        { participants: { some: { id: userB } } },
      ],
    },
    select: { id: true },
  });
  if (!conversations.length) return;
  await prisma.conversation.updateMany({
    where: { id: { in: conversations.map((conversation) => conversation.id) } },
    data: { requestStatus: 'accepted' },
  });
}

export async function notifyMessageRequest(senderUserId: string, recipientUserId: string) {
  const actor = await getProfileForUser(senderUserId);
  const recipient = await getProfileForUser(recipientUserId);
  if (!actor || !recipient) return;
  await notify({
    recipientId: recipient.id,
    actorId: actor.id,
    notificationType: 'message_request',
    message: `${actor.username} sent you a message request`,
  });
}

export async function withdrawMessageRequestNotification(senderUserId: string, recipientUserId: string) {
  const actor = await getProfileForUser(senderUserId);
  const recipient = await getProfileForUser(recipientUserId);
  if (!actor || !recipient) return;
  await withdrawNotification({
    recipientId: recipient.id,
    actorId: actor.id,
    notificationType: 'message_request',
  });
}
