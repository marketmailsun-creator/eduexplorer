import { researchTopic } from '../api/claude';
import { prisma } from '../db/prisma';
import { getCached, setCache } from '../db/redis';

export async function processResearchQuery(
  userId: string,
  queryText: string,
  learningLevel: string
) {
  const cacheKey = `research:${queryText}:${learningLevel}`;
  const cached = await getCached(cacheKey);
  
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const query = await prisma.query.create({
    data: {
      userId,
      queryText,
      complexityLevel: learningLevel,
      status: 'processing',
    },
  });

  try {
    const result = await researchTopic(queryText, learningLevel);

    await prisma.researchData.create({
      data: {
        queryId: query.id,
        rawData: result as any, // ✅ Simple cast
        sources: result.sources as any,
        summary: result.content.substring(0, 500),
      },
    });

    await prisma.query.update({
      where: { id: query.id },
      data: {
        status: 'completed',
        topicDetected: result.topic,
      },
    });

    const response = { queryId: query.id, ...result };
    await setCache(cacheKey, response, 86400);

    return response;
  } catch (error) {
    await prisma.query.update({
      where: { id: query.id },
      data: { status: 'failed' },
    });
    throw error;
  }
}