import { postRepository } from '../infrastructure/repositories/postRepository';
import { Post } from '../domain/post';
import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

function mapPost(prismaPost: any): Post | null {
  if (!prismaPost) return null;
  return {
    id: prismaPost.id,
    profileId: prismaPost.profileId,
    content: prismaPost.content,
    image: prismaPost.image,
    createdAt: prismaPost.createdAt,
    updatedAt: prismaPost.updatedAt,
    visibility: prismaPost.visibility,
  };
}

export const postService = {
  async getPostById(id: string): Promise<Post | null> {
    const post = await postRepository.getPostById(id);
    return mapPost(post);
  },
  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & { taggedProfiles?: string[] }): Promise<Post> {
    const created = await postRepository.createPost({
      ...post,
      content: post.content ?? undefined,
      image: post.image ?? undefined,
      visibility: post.visibility ?? 'public',
      taggedProfiles: post.taggedProfiles ? { connect: post.taggedProfiles.map(id => ({ id })) } : undefined,
    });
    return mapPost(created)!;
  },
  async listPosts(): Promise<Post[]> {
    const posts = await postRepository.listPosts();
    return posts.map(mapPost).filter(Boolean) as Post[];
  },
  async updatePost(id: string, data: Partial<Post> & { taggedProfiles?: string[] }): Promise<Post | null> {
    const updated = await postRepository.updatePost(id, {
      ...data,
      taggedProfiles: data.taggedProfiles ? { set: data.taggedProfiles.map(id => ({ id })) } : undefined,
    });
    return mapPost(updated);
  },
  async deletePost(id: string): Promise<void> {
    await postRepository.deletePost(id);
  },
  async getFeedForUser(userId: string): Promise<Post[]> {
    // 1. Get user's profile
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return [];
    // 2. Get friends' profiles
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    });
    const friendIds = friendships.map(f => f.user1Id === userId ? f.user2Id : f.user1Id);
    const friendProfiles = await prisma.profile.findMany({ where: { userId: { in: friendIds } } });
    const friendProfileIds = friendProfiles.map(p => p.id);
    // 3. Get following profiles
    const following = await prisma.follow.findMany({ where: { followerId: profile.id } });
    const followingIds = following.map(f => f.followingId);
    // 4. Get posts
    const publicPosts = await prisma.post.findMany({ where: { visibility: 'public' } });
    const ownPosts = await prisma.post.findMany({ where: { profileId: profile.id } });
    const taggedPosts = await prisma.post.findMany({ where: { taggedProfiles: { some: { id: profile.id } } } });
    const friendsPosts = await prisma.post.findMany({ where: { profileId: { in: friendProfileIds }, visibility: 'authenticated' } });
    const followingPosts = await prisma.post.findMany({ where: { profileId: { in: followingIds }, visibility: { in: ['authenticated', 'public'] } } });
    const privatePosts = await prisma.post.findMany({ where: { profileId: profile.id, visibility: 'private' } });
    // Merge, deduplicate, sort
    const all = [...publicPosts, ...ownPosts, ...taggedPosts, ...friendsPosts, ...followingPosts, ...privatePosts];
    const unique = Array.from(new Map(all.map(p => [p.id, p])).values());
    unique.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return unique.map(mapPost).filter(Boolean) as Post[];
  },
  async likePost(postId: string, userId: string): Promise<Post | null> {
    // Get profile
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return null;
    // Update likes
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { likes: { connect: { id: profile.id } } },
      include: { likes: true },
    });
    // Create notification for post owner
    if (updated.profileId !== profile.id) {
      await prisma.notification.create({
        data: {
          recipientId: updated.profileId,
          actorId: profile.id,
          notificationType: 'like',
          message: `${profile.username} liked your post`,
          relatedPostId: postId,
          isRead: false,
          timestamp: new Date(),
        },
      });
    }
    return mapPost(updated);
  },
  async unlikePost(postId: string, userId: string): Promise<Post | null> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return null;
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { likes: { disconnect: { id: profile.id } } },
      include: { likes: true },
    });
    return mapPost(updated);
  },
};
