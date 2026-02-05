import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { processResearchQuery } from '@/lib/services/research.service';
import { generateContentForQuery } from '@/lib/services/content.service';
import { moderateContent, getModerationErrorMessage, quickModerationCheck } from '@/lib/services/content-moderation.service';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const querySchema = z.object({
  query: z.string().min(3).max(500),
  learningLevel: z.enum(['elementary', 'high-school', 'college', 'adult']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { query, learningLevel = 'college' } = querySchema.parse(body);

    console.log('📝 Query submitted:', query);

    // Get user's age for age-appropriate filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { age: true, dateOfBirth: true },
    });

    // Ensure null from the DB becomes `undefined` so it matches expected parameter type
    const userAge: number | undefined = user?.age ?? undefined;
    console.log('👤 User age:', userAge ?? 'unknown');

    // Step 1: Quick keyword check (fast)
    const quickCheckFailed = quickModerationCheck(query);
    
    if (quickCheckFailed) {
      console.log('🚫 Quick moderation failed - running full check');
    }

    // Step 2: Full AI moderation (slower, but more accurate)
    // Always run for minors, run for adults only if quick check failed
    const shouldRunFullModeration = (userAge && userAge < 18) || quickCheckFailed;

    if (shouldRunFullModeration) {
      console.log('🛡️ Running content moderation...');
      
      const moderationResult = await moderateContent(query, userAge);

      if (!moderationResult.isAppropriate) {
        console.log('🚫 Content blocked by moderation');
        
        const errorMessage = getModerationErrorMessage(moderationResult, userAge);
        
        return NextResponse.json(
          { 
            error: errorMessage,
            moderationResult: {
              category: moderationResult.category,
              severity: moderationResult.severity,
            }
          },
          { status: 400 }
        );
      }

      console.log('✅ Content passed moderation');
    } else {
      console.log('⏩ Skipping full moderation (adult user, no flags)');
    }

    // Process the query
    const result = await processResearchQuery(session.user.id, query, learningLevel);

    // Generate content asynchronously
    //generateContentForQuery(result.queryId).catch(console.error);
    await generateContentForQuery(result.queryId);
    
    return NextResponse.json({
      success: true,
      queryId: result.queryId,
      content: result.content,
      sources: result.sources,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Query submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
