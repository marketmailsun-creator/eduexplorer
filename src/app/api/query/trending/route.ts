import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { getCached, setCache } from '@/lib/db/redis';

const CACHE_KEY = 'trending:topics:v2';
const CACHE_TTL = 3600; // 1 hour

const POPULAR_TOPICS = [
  'Photosynthesis',
  'Quadratic Equations',
  'French Revolution',
  'Newton\'s Laws of Motion',
  'DNA Replication',
  'Compound Interest',
  'Periodic Table',
  'Indian Independence Movement',
  'Machine Learning Basics',
  'Human Digestive System',
  'World War II',
  'Pythagorean Theorem',
  'Climate Change',
  'Supply and Demand',
  'Shakespeare\'s Hamlet',
  'Trigonometry',
  'Cell Division',
  'Stock Market Basics',
  'Electromagnetic Waves',
  'The Renaissance',
];

const GENERIC_MEDIA_LABELS = new Set(['Image Analysis', 'Document Analysis', 'Voice Query', 'Query']);

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Redis cache first
    const cached = await getCached<string[]>(CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return NextResponse.json({ topics: cached });
    }

    // Query DB for top topics from the last 7 days across all users
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const grouped = await prisma.query.groupBy({
      by: ['topicDetected'],
      where: {
        status: 'completed',
        topicDetected: { not: null },
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { topicDetected: true },
      orderBy: { _count: { topicDetected: 'desc' } },
      take: 10,
    });

    const trendingTopics: string[] = grouped
      .map((g) => g.topicDetected as string)
      .filter((t) =>
        Boolean(t) &&
        t.length <= 80 &&
        !t.includes('[Image content:') &&
        !t.includes('[Document') &&
        !t.startsWith('Please analyze') &&
        !GENERIC_MEDIA_LABELS.has(t)
      );

    // Fill with curated popular topics if not enough trending data
    if (trendingTopics.length < 5) {
      const trendingSet = new Set(trendingTopics);
      const shuffled = shuffleArray(POPULAR_TOPICS).filter((t) => !trendingSet.has(t));
      const needed = 10 - trendingTopics.length;
      trendingTopics.push(...shuffled.slice(0, needed));
    }

    // Cache in Redis for 1 hour
    await setCache(CACHE_KEY, trendingTopics, CACHE_TTL);

    return NextResponse.json({ topics: trendingTopics });
  } catch (error) {
    console.error('Trending topics fetch error:', error);
    // Fallback: return shuffled popular topics on error (no Redis write)
    return NextResponse.json({ topics: shuffleArray(POPULAR_TOPICS).slice(0, 8) });
  }
}
