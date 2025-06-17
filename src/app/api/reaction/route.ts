import { NextRequest, NextResponse } from 'next/server';
import { reactionService } from '../../../application/reactionService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const reaction = await reactionService.getReactionById(id);
    if (!reaction) return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
    return NextResponse.json(reaction);
  }
  // List all reactions if no id is provided
  const reactions = await reactionService.listReactions();
  return NextResponse.json(reactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.messageId || !body.userId || !body.emoji) {
    return NextResponse.json({ error: 'Missing messageId, userId, or emoji' }, { status: 400 });
  }
  try {
    const reaction = await reactionService.createReaction({
      messageId: body.messageId,
      userId: body.userId,
      emoji: body.emoji,
      createdAt: new Date(),
    });
    return NextResponse.json(reaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create reaction' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await reactionService.updateReaction(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update reaction' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await reactionService.deleteReaction(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete reaction' }, { status: 500 });
  }
} 