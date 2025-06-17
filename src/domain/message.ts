export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  gifUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
} 