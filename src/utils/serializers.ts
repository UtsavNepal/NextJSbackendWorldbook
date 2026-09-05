import { censorText } from './censorText';

function stripUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    birthday: user.birthday,
    gender: user.gender,
    joined_at: user.joinedAt,
    profile_picture: user.profilePicture,
    is_verified: user.isVerified,
    is_active: user.isActive,
  };
}

export function serializeUser(user: any) {
  if (!user) return null;
  const profile = user.profile;
  return {
    ...stripUser(user),
    username: profile?.username ?? user.firstname ?? user.email,
    profile_picture: profile?.profilePicture ?? user.profilePicture,
    profile_id: profile?.id ?? null,
    user: stripUser(user),
  };
}

export function serializeProfile(profile: any, options: { withPosts?: boolean; viewerProfileId?: string | null; friendship?: any } = {}) {
  if (!profile) return null;
  const followers = profile.followers ?? [];
  const following = profile.following ?? [];
  const canSeePost = (post: any) => {
    if (post.profileId === options.viewerProfileId) return true;
    if (post.visibility === 'private') return false;
    if (post.visibility === 'authenticated' && !options.friendship?.is_friend) return false;
    return true;
  };
  const posts = options.withPosts && Array.isArray(profile.posts)
    ? profile.posts.filter(canSeePost).map((post: any) => serializePost(post, options.viewerProfileId))
    : [];
  return {
    id: profile.id,
    profile_picture: profile.profilePicture,
    cover_photo: profile.coverPhoto ?? null,
    username: profile.username,
    bio: profile.bio,
    total_posts: profile.totalPosts ?? (profile.posts?.length ?? 0),
    total_friends: profile.totalFriends ?? 0,
    posts,
    tagged_posts: options.withPosts && Array.isArray(profile.taggedPosts)
      ? profile.taggedPosts.map((post: any) => serializePost(post, options.viewerProfileId))
      : [],
    post_photos: (profile.posts ?? [])
      .flatMap((p: any) => {
        const photos = Array.isArray(p?.images) && p.images.length ? p.images : p?.image ? [p.image] : [];
        return photos.map((image: string) => ({ id: p.id, image }));
      }),
    user: stripUser(profile.user) ?? { id: profile.userId },
    total_followers: followers.length,
    total_following: following.length,
    friends: profile.friends ?? [],
    is_friend: Boolean(options.friendship?.is_friend),
    friend_request_sent: Boolean(options.friendship?.friend_request_sent),
    friend_request_received: Boolean(options.friendship?.friend_request_received),
    friend_request_id: options.friendship?.friend_request_id ?? null,
  };
}

export function serializeComment(comment: any): any {
  if (!comment) return null;
  return {
    id: comment.id,
    comment: censorText(comment.comment),
    created_at: comment.createdAt,
    parent: comment.parentId,
    parentId: comment.parentId,
    profile: serializeProfile(comment.profile) ?? {
      username: 'user',
      profile_picture: null,
      user: { id: comment.profileId },
    },
    replies: Array.isArray(comment.replies) ? comment.replies.map(serializeComment) : [],
  };
}

export function serializePost(post: any, viewerProfileId?: string | null) {
  if (!post) return null;
  const likes = post.likes ?? [];
  const comments = post.comments ?? [];
  const isLiked = Boolean(
    viewerProfileId &&
    Array.isArray(likes) &&
    likes.some((like: any) => like.id === viewerProfileId)
  );
  return {
    id: post.id,
    content: censorText(post.content ?? ''),
    image: (Array.isArray(post.images) && post.images[0]) || post.image || null,
    images: Array.isArray(post.images) && post.images.length
      ? post.images
      : post.image
        ? [post.image]
        : [],
    created_at: post.createdAt,
    updated_at: post.updatedAt,
    visibility: post.visibility,
    post_type: post.type || 'status',
    tagged_profiles: (post.taggedProfiles ?? []).map(serializeProfile),
    profile: serializeProfile(post.profile),
    likes: Array.isArray(likes) ? likes.length : likes,
    is_liked: isLiked,
    comments: comments.map(serializeComment),
  };
}

export function serializeFriendRequest(request: any) {
  if (!request) return null;
  const fromProfile = request.fromUser?.profile
    ? serializeProfile({ ...request.fromUser.profile, user: request.fromUser })
    : serializeUser(request.fromUser);
  const toProfile = request.toUser?.profile
    ? serializeProfile({ ...request.toUser.profile, user: request.toUser })
    : serializeUser(request.toUser);
  return {
    id: request.id,
    from_user: fromProfile,
    to_user: toProfile,
    status: request.status,
    created_at: request.createdAt,
  };
}

export function serializeConversation(conversation: any, viewerId?: string) {
  if (!conversation) return null;
  const requestStatus = conversation.requestStatus || 'accepted';
  const requestedBy = conversation.requestedById || null;
  const incomingRequest = requestStatus === 'pending' && Boolean(requestedBy) && requestedBy !== viewerId;
  return {
    id: conversation.id,
    name: conversation.name,
    is_group: conversation.isGroup,
    participants: (conversation.participants ?? []).map(serializeUser),
    messages: (conversation.messages ?? [])
      .filter((message: any) => !viewerId || !(message.hiddenFor ?? []).includes(viewerId))
      .map(serializeMessage),
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
    request_status: requestStatus,
    requested_by: requestedBy,
    is_message_request: incomingRequest,
  };
}

export function serializeMessage(message: any) {
  if (!message) return null;
  const unsent = Boolean(message.deleted);
  return {
    id: message.id,
    conversation: message.conversationId,
    sender: serializeUser(message.sender),
    text: unsent ? '' : censorText(message.text),
    image: unsent ? null : message.imageUrl,
    gif_url: unsent ? null : message.gifUrl,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
    deleted: unsent,
    reactions: unsent
      ? []
      : (message.reactions ?? []).map((reaction: any) => ({
      id: reaction.id,
      user: serializeUser(reaction.user),
      message: reaction.messageId,
      emoji: reaction.emoji,
      created_at: reaction.createdAt,
    })),
  };
}

export function serializeNotification(notification: any) {
  if (!notification) return null;
  return {
    id: notification.id,
    recipient: serializeProfile(notification.recipient),
    actor: serializeProfile(notification.actor),
    notification_type: notification.notificationType,
    message: notification.message,
    related_post: notification.relatedPost ? serializePost(notification.relatedPost) : null,
    related_comment: notification.relatedComment ? serializeComment(notification.relatedComment) : null,
    is_read: notification.isRead,
    timestamp: notification.timestamp,
  };
}

export const postInclude = {
  profile: { include: { user: true } },
  likes: true,
  taggedProfiles: { include: { user: true } },
  comments: {
    include: { profile: { include: { user: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

export const profileInclude = {
  user: true,
  posts: { include: postInclude, orderBy: { createdAt: 'desc' as const } },
  taggedPosts: { include: postInclude },
  followers: true,
  following: true,
};

export const friendRequestInclude = {
  fromUser: { include: { profile: true } },
  toUser: { include: { profile: true } },
};

export const conversationInclude = {
  participants: { include: { profile: true } },
  messages: {
    include: {
      sender: { include: { profile: true } },
      reactions: { include: { user: { include: { profile: true } } } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

export const notificationInclude = {
  recipient: { include: { user: true } },
  actor: { include: { user: true } },
  relatedPost: { include: postInclude },
  relatedComment: { include: { profile: { include: { user: true } } } },
};
