// ============================================================
// src/app/api/suggestions/[queryId]/route.ts
// GROQ VERSION — swap this in when Claude quota is exhausted
// Uses llama-3.1-8b-instant (FREE, fast, good enough for suggestions)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import OpenAI from 'openai'; // ← already installed, Groq uses same SDK

// ✅ Reuse the same Groq client already configured in content.service.ts
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

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

    // ✅ Return cached suggestions — never call the model twice for same topic
    const cached = await prisma.content.findFirst({
      where: { queryId, contentType: 'suggestions' },
    });
    if (cached) {
      console.log('💾 Returning cached suggestions for:', queryId);
      return NextResponse.json({ suggestions: (cached.data as any).suggestions ?? [] });
    }

    // Fetch the topic from DB
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      select: { queryText: true, topicDetected: true },
    });
    if (!query) return NextResponse.json({ suggestions: [] });

    const topic = query.topicDetected || query.queryText;
    console.log('🤖 Generating suggestions with Groq for topic:', topic);

    // ✅ Call Groq — same API shape as OpenAI
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // FREE tier, ~500 tokens/sec
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful educational assistant. Return ONLY valid JSON arrays, no explanation, no markdown.',
        },
        {
          role: 'user',
          content: `A student just finished learning about: "${topic}"

Suggest 4 related topics they should explore next.
Return ONLY this JSON array with no other text:
[
  { "topic": "Short name (max 5 words)", "reason": "Why it's useful (max 7 words)", "emoji": "🎯" },
  { "topic": "...", "reason": "...", "emoji": "..." },
  { "topic": "...", "reason": "...", "emoji": "..." },
  { "topic": "...", "reason": "...", "emoji": "..." }
]`,
        },
      ],
    });

    const raw = response.choices[0].message.content || '';
    console.log('📝 Groq raw response:', raw.substring(0, 200));

    // Parse JSON safely
    let suggestions: any[] = [];
    try {
      const match = raw.match(/\[[\s\S]*?\]/);
      suggestions = match ? JSON.parse(match[0]) : [];
    } catch (parseError) {
      console.error('❌ JSON parse failed, returning empty suggestions');
      suggestions = [];
    }

    // ✅ Cache permanently so this topic never costs tokens again
    if (suggestions.length > 0) {
      await prisma.content.create({
        data: {
          queryId,
          contentType: 'suggestions',
          title: 'What to Learn Next',
          data: { suggestions },
        },
      });
      console.log('💾 Suggestions cached for future use');
    }

    return NextResponse.json({ suggestions });

  } catch (error: any) {
    console.error('❌ Suggestions API error:', error.message);
    return NextResponse.json({ suggestions: [] }); // Always return gracefully
  }
}