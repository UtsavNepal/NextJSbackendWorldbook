import { Chat } from '../domain/chat';

export interface ChatService {
  getChatById(id: string): Promise<Chat | null>;
  sendMessage(chat: Omit<Chat, 'id' | 'createdAt'>): Promise<Chat>;
}

const chats: Chat[] = [];

export const chatService: ChatService = {
  async getChatById(id) {
    return chats.find(c => c.id === id) || null;
  },
  async sendMessage(chat) {
    const newChat: Chat = {
      ...chat,
      id: (chats.length + 1).toString(),
      createdAt: new Date(),
    };
    chats.push(newChat);
    return newChat;
  },
}; 