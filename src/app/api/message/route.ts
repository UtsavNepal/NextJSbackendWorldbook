import { NextRequest, NextResponse } from 'next/server';
import { messageService } from '../../../application/messageService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const msg = await messageService.getMessageById(id);
    if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    return NextResponse.json(msg);
  }
  // List all messages if no id is provided
  const msgs = await messageService.listMessages();
  return NextResponse.json(msgs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.conversationId || !body.senderId) {
    return NextResponse.json({ error: 'Missing conversationId or senderId' }, { status: 400 });
  }
  try {
    const msg = await messageService.createMessage({
      conversationId: body.conversationId,
      senderId: body.senderId,
      text: body.text,
      imageUrl: body.imageUrl,
      gifUrl: body.gifUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
    });
    return NextResponse.json(msg, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create message' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await messageService.updateMessage(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await messageService.deleteMessage(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete message' }, { status: 500 });
  }
} 