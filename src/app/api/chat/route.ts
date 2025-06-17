import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '../../../application/chatService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const chat = await chatService.getChatById(id);
  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  return NextResponse.json(chat);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.senderId || !body.receiverId || !body.message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const chat = await chatService.sendMessage({ senderId: body.senderId, receiverId: body.receiverId, message: body.message });
  return NextResponse.json(chat, { status: 201 });
} 