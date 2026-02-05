import { prisma } from '../db/prisma';

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    audio: 1,
    presentations: 1,
    flashcards: 1,
    quizzes: 1,
    audioOnDemand: false,
  },
  pro: {
    audio: 5,
    presentations: 999, // Unlimited
    flashcards: 5,
    quizzes: 999, // Unlimited
    audioOnDemand: true,
  },
};

/**
 * Get user's plan
 */
export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  return (user?.plan as 'free' | 'pro') || 'free';
}

/**
 * Check if user can generate specific content type
 */
export async function canGenerateContent(
  userId: string,
  queryId: string,
  contentType: 'audio' | 'presentation' | 'flashcard' | 'quiz'
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  // Get count of existing content of this type for this query
  const existingCount = await prisma.content.count({
    where: {
      queryId,
      contentType,
    },
  });

  const limitKey = contentType === 'quiz' ? 'quizzes' : 
                   contentType === 'presentation' ? 'presentations' :
                   contentType === 'flashcard' ? 'flashcards' : 'audio';
  
  const limit = limits[limitKey];

  if (existingCount >= limit) {
    return {
      allowed: false,
      reason: `You've reached the ${plan.toUpperCase()} plan limit of ${limit} ${contentType}${limit > 1 ? 's' : ''} per topic. ${plan === 'free' ? 'Upgrade to Pro for more!' : ''}`,
      current: existingCount,
      limit,
    };
  }

  return {
    allowed: true,
    current: existingCount,
    limit,
  };
}

/**
 * Check if user can generate audio on-demand
 */
export async function canGenerateAudioOnDemand(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return PLAN_LIMITS[plan].audioOnDemand;
}

/**
 * Get remaining content allowance for a query
 */
export async function getContentAllowance(userId: string, queryId: string) {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  // Count existing content by type
  const contentCounts = await prisma.content.groupBy({
    by: ['contentType'],
    where: { queryId },
    _count: { contentType: true },
  });

  const counts: Record<string, number> = {};
  contentCounts.forEach(item => {
    counts[item.contentType] = item._count.contentType;
  });

  return {
    plan,
    audio: {
      used: counts['audio'] || 0,
      limit: limits.audio,
      remaining: Math.max(0, limits.audio - (counts['audio'] || 0)),
    },
    presentations: {
      used: counts['presentation'] || 0,
      limit: limits.presentations,
      remaining: limits.presentations === 999 ? 999 : Math.max(0, limits.presentations - (counts['presentation'] || 0)),
    },
    flashcards: {
      used: counts['flashcard'] || 0,
      limit: limits.flashcards,
      remaining: Math.max(0, limits.flashcards - (counts['flashcard'] || 0)),
    },
    quizzes: {
      used: counts['quiz'] || 0,
      limit: limits.quizzes,
      remaining: limits.quizzes === 999 ? 999 : Math.max(0, limits.quizzes - (counts['quiz'] || 0)),
    },
    audioOnDemand: limits.audioOnDemand,
  };
}

/**
 * Get user's plan info with features
 */
export async function getUserPlanInfo(userId: string) {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    features: {
      unlimitedSearches: true,
      articleGeneration: true,
      audioLimit: limits.audio,
      presentationLimit: limits.presentations,
      flashcardLimit: limits.flashcards,
      quizLimit: limits.quizzes,
      audioOnDemand: limits.audioOnDemand,
      diagrams: true,
      conceptMaps: true,
      downloadContent: plan === 'pro',
      prioritySupport: plan === 'pro',
      noAds: plan === 'pro',
    },
  };
}
