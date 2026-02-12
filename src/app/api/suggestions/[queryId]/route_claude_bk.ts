import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { queryId } = await params;

    // ✅ Return cached suggestions if they exist — never pay twice
    const cached = await prisma.content.findFirst({
      where: { queryId, contentType: 'suggestions' },
    });
    if (cached) {
      return NextResponse.json({ suggestions: (cached.data as any).suggestions ?? [] });
    }

    // Get the topic
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      select: { queryText: true, topicDetected: true },
    });
    if (!query) return NextResponse.json({ suggestions: [] });

    const topic = query.topicDetected || query.queryText;

    // Generate with Claude — cheap, fast, cached forever
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `A student just learned about: "${topic}"

          Suggest 4 related educational topics to explore next.
          Return ONLY a valid JSON array with NO markdown, NO explanation, NO code fences:
          [
            { "topic": "Short name (max 5 words)", "reason": "Why it matters (max 7 words)", "emoji": "🎯" },
            { "topic": "...", "reason": "...", "emoji": "..." },
            { "topic": "...", "reason": "...", "emoji": "..." },
            { "topic": "...", "reason": "...", "emoji": "..." }
          ]`,
      }],
    });

    const raw = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('');

    const match = raw.match(/\[[\s\S]*?\]/);
    let suggestions: any[] = [];
    try {
      suggestions = match ? JSON.parse(match[0]) : [];
    } catch {
      suggestions = [];
    }

    // ✅ Cache permanently so we never pay for this topic again
    if (suggestions.length > 0) {
      await prisma.content.create({
        data: {
          queryId,
          contentType: 'suggestions',
          title: 'What to Learn Next',
          data: { suggestions },
        },
      });
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] }); // Always return gracefully
  }
}