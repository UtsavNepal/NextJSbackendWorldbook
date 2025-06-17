import { conversationRepository } from '../infrastructure/repositories/conversationRepository';
import { Conversation } from '../domain/conversation';

function mapConversation(prismaConv: any): Conversation | null {
  if (!prismaConv) return null;
  return {
    id: prismaConv.id,
    name: prismaConv.name,
    isGroup: prismaConv.isGroup,
    participantIds: prismaConv.participantIds || [],
    createdAt: prismaConv.createdAt,
    updatedAt: prismaConv.updatedAt,
  };
}

export const conversationService = {
  async getConversationById(id: string): Promise<Conversation | null> {
    const conv = await conversationRepository.getConversationById(id);
    return mapConversation(conv);
  },
  async createConversation(conv: Omit<Conversation, 'id'>): Promise<Conversation> {
    const created = await conversationRepository.createConversation(conv);
    return mapConversation(created)!;
  },
  async listConversations(): Promise<Conversation[]> {
    const convs = await conversationRepository.listConversations();
    return convs.map(mapConversation).filter(Boolean) as Conversation[];
  },
  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | null> {
    const updated = await conversationRepository.updateConversation(id, data);
    return mapConversation(updated);
  },
  async deleteConversation(id: string): Promise<void> {
    await conversationRepository.deleteConversation(id);
  },
}; 