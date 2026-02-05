import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { extractKeyPoints, generateConceptMapData } from '@/lib/utils/concept-map-utils';
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { queryId } = await request.json();

    if (!queryId) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 });
    }

    console.log('🗺️  Generating concept map for query:', queryId);

    // Check if concept map already exists
    const existingConceptMap = await prisma.content.findFirst({
      where: {
        queryId,
        contentType: 'concept-map',
      },
    });

    if (existingConceptMap) {
      console.log('✅ Concept map already exists');
      return NextResponse.json({
        success: true,
        message: 'Concept map already exists',
        conceptMap: existingConceptMap.data,
      });
    }

    // Get the query and article data
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      include: {
        researchData: true,
        content: {
          where: {
            contentType: 'article',
          },
        },
      },
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    // Extract article text
    const articleContent = query.content.find((c) => c.contentType === 'article');
    const articleText =
      (articleContent?.data as any)?.text ||
      (query.researchData as any)?.rawData?.content ||
      '';

    if (!articleText) {
      return NextResponse.json(
        { error: 'No article content found for this query' },
        { status: 400 }
      );
    }

    console.log('📝 Extracting key points from article...');
    
    // Generate concept map data
    const keyPoints = extractKeyPoints(articleText, 6);
    const conceptMapData = generateConceptMapData(query.queryText, keyPoints);

    // Enhance concept map data for better display
    const enhancedMapData = {
      mainTopic: query.queryText,
      nodes: conceptMapData.nodes.map((node, index) => ({
        id: node.id,
        label: node.label,
        description: keyPoints[index - 1] || node.label,
        category: node.category === 'main' ? 'Main Concept' : 'Key Point',
      })),
      links: conceptMapData.links,
    };

    console.log('✅ Concept map generated with', enhancedMapData.nodes.length, 'nodes');

    // Save to database
    const savedConceptMap = await prisma.content.create({
      data: {
        queryId,
        contentType: 'concept-map',
        title: `${query.queryText} - Concept Map`,
        data: enhancedMapData as unknown as Prisma.InputJsonValue,
      },
    });

    console.log('💾 Concept map saved to database');

    return NextResponse.json({
      success: true,
      message: 'Concept map generated successfully',
      conceptMap: savedConceptMap.data,
    });
  } catch (error) {
    console.error('❌ Concept map generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate concept map' },
      { status: 500 }
    );
  }
}