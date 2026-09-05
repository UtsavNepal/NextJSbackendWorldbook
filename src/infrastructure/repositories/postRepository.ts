import { Prisma } from '@prisma/client';
import { prisma } from '@/infrastructure/prisma';

export const postRepository = {
  async getPostById(id: string) {
    return prisma.post.findUnique({ where: { id } });
  },
  async createPost(data: {
    profileId: string;
    content?: string;
    image?: string;
    images?: string[];
    visibility?: string;
    taggedProfiles?: { connect: { id: string }[] };
    likes?: { connect: { id: string }[] };
  }) {
    return prisma.post.create({ data });
  },
  async listPosts() {
    return prisma.post.findMany();
  },
  async updatePost(id: string, data: Prisma.PostUncheckedUpdateInput) {
    return prisma.post.update({ where: { id }, data });
  },
  async deletePost(id: string) {
    return prisma.post.delete({ where: { id } });
  },
  async likePost(postId: string, profileId: string) {
    return prisma.post.update({
      where: { id: postId },
      data: { likes: { connect: { id: profileId } } },
      include: { likes: true },
    });
  },
  async unlikePost(postId: string, profileId: string) {
    return prisma.post.update({
      where: { id: postId },
      data: { likes: { disconnect: { id: profileId } } },
      include: { likes: true },
    });
  },
};