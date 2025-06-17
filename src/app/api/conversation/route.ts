import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '../../../application/conversationService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const conv = await conversationService.getConversationById(id);
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    return NextResponse.json(conv);
  }
  // List all conversations if no id is provided
  const convs = await conversationService.listConversations();
  return NextResponse.json(convs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const conv = await conversationService.createConversation({
      name: body.name,
      isGroup: body.isGroup ?? false,
      participantIds: body.participantIds || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return NextResponse.json(conv, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create conversation' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await conversationService.updateConversation(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update conversation' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await conversationService.deleteConversation(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete conversation' }, { status: 500 });
  }
} 