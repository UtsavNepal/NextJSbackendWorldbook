import { postRepository } from '../infrastructure/repositories/postRepository';
import { Post } from '../domain/post';

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
  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const created = await postRepository.createPost({
      ...post,
      content: post.content ?? undefined,
      image: post.image ?? undefined,
      visibility: post.visibility ?? 'public',
    });
    return mapPost(created)!;
  },
  async listPosts(): Promise<Post[]> {
    const posts = await postRepository.listPosts();
    return posts.map(mapPost).filter(Boolean) as Post[];
  },
  async updatePost(id: string, data: Partial<Post>): Promise<Post | null> {
    const updated = await postRepository.updatePost(id, data);
    return mapPost(updated);
  },
  async deletePost(id: string): Promise<void> {
    await postRepository.deletePost(id);
  },
};
