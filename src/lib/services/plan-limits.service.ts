import { prisma } from '../db/prisma';
import { redis } from '../db/redis';

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    audio: 0,              // no audio for free plan
    presentations: 0,      // no presentations for free plan
    flashcards: 1,         // 1 flashcard set per topic
    quizzes: 1,            // 1 basic quiz per topic
    audioOnDemand: false,
  },
  pro: {
    audio: 5,
    presentations: 999,    // Unlimited
    flashcards: 999,       // Unlimited
    quizzes: 999,          // Unlimited
    audioOnDemand: true,
  },
};

// Daily lesson limits (AI queries/searches per day)
const DAILY_LESSON_LIMIT = { free: 5, pro: Infinity } as const;

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get how many AI lessons a free-plan user has remaining today.
 */
export async function getDailyLessonsRemaining(
  userId: string,
  plan: 'free' | 'pro'
): Promise<number> {
  if (plan === 'pro') return Infinity;
  const key = `daily_lessons:${userId}:${todayKey()}`;
  const count = (await redis.get<number>(key)) ?? 0;
  return Math.max(0, DAILY_LESSON_LIMIT.free - count);
}

/**
 * Increment the daily lesson counter for a user.
 */
export async function incrementDailyLessons(userId: string): Promise<void> {
  const key = `daily_lessons:${userId}:${todayKey()}`;
  await redis.incr(key);
  // TTL of 36h so it survives past midnight without resetting mid-day
  await redis.expire(key, 36 * 60 * 60);
}

/**
 * Check whether the user is allowed to submit a new AI lesson query today.
 */
export async function checkDailyLessonAllowed(
  userId: string,
  plan: 'free' | 'pro'
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  if (plan === 'pro') {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }
  const remaining = await getDailyLessonsRemaining(userId, plan);
  return {
    allowed: remaining > 0,
    remaining,
    limit: DAILY_LESSON_LIMIT.free,
  };
}

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
