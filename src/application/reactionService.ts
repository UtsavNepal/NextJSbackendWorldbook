import { reactionRepository } from '../infrastructure/repositories/reactionRepository';
import { Reaction } from '../domain/reaction';

function mapReaction(prismaReaction: any): Reaction | null {
  if (!prismaReaction) return null;
  return {
    id: prismaReaction.id,
    messageId: prismaReaction.messageId,
    userId: prismaReaction.userId,
    emoji: prismaReaction.emoji,
    createdAt: prismaReaction.createdAt,
  };
}

export const reactionService = {
  async getReactionById(id: string): Promise<Reaction | null> {
    const reaction = await reactionRepository.getReactionById(id);
    return mapReaction(reaction);
  },
  async createReaction(reaction: Omit<Reaction, 'id'>): Promise<Reaction> {
    const created = await reactionRepository.createReaction(reaction);
    return mapReaction(created)!;
  },
  async listReactions(): Promise<Reaction[]> {
    const reactions = await reactionRepository.listReactions();
    return reactions.map(mapReaction).filter(Boolean) as Reaction[];
  },
  async updateReaction(id: string, data: Partial<Reaction>): Promise<Reaction | null> {
    const updated = await reactionRepository.updateReaction(id, data);
    return mapReaction(updated);
  },
  async deleteReaction(id: string): Promise<void> {
    await reactionRepository.deleteReaction(id);
  },
}; 