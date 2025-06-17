import { messageRepository } from '../infrastructure/repositories/messageRepository';
import { Message } from '../domain/message';

function mapMessage(prismaMsg: any): Message | null {
  if (!prismaMsg) return null;
  return {
    id: prismaMsg.id,
    conversationId: prismaMsg.conversationId,
    senderId: prismaMsg.senderId,
    text: prismaMsg.text,
    imageUrl: prismaMsg.imageUrl,
    gifUrl: prismaMsg.gifUrl,
    createdAt: prismaMsg.createdAt,
    updatedAt: prismaMsg.updatedAt,
    deleted: prismaMsg.deleted,
  };
}

export const messageService = {
  async getMessageById(id: string): Promise<Message | null> {
    const msg = await messageRepository.getMessageById(id);
    return mapMessage(msg);
  },
  async createMessage(msg: Omit<Message, 'id'>): Promise<Message> {
    const created = await messageRepository.createMessage(msg);
    return mapMessage(created)!;
  },
  async listMessages(): Promise<Message[]> {
    const msgs = await messageRepository.listMessages();
    return msgs.map(mapMessage).filter(Boolean) as Message[];
  },
  async updateMessage(id: string, data: Partial<Message>): Promise<Message | null> {
    const updated = await messageRepository.updateMessage(id, data);
    return mapMessage(updated);
  },
  async deleteMessage(id: string): Promise<void> {
    await messageRepository.deleteMessage(id);
  },
};
