export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  participantIds: string[];
  createdAt: Date;
  updatedAt: Date;
} 