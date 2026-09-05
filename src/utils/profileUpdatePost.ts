import { prisma } from '@/infrastructure/prisma';

export async function createProfileUpdatePost(
  profileId: string,
  imageUrl: string,
  type: 'profile_picture' | 'cover_photo'
) {
  try {
    await prisma.post.create({
      data: {
        profileId,
        content: '',
        visibility: 'public',
        image: imageUrl,
        images: [imageUrl],
        type,
      },
    });
    await prisma.profile.update({
      where: { id: profileId },
      data: { totalPosts: { increment: 1 } },
    });
  } catch (error) {
    console.error('Failed to create profile update post', error);
  }
}
