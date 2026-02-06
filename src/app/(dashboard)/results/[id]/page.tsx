import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, BookOpen, FileText, Presentation, Layers, Brain, BarChart3, Network, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { AudioPlayerSection } from '@/components/features/AudioPlayerSection';
import { formatForDisplay } from '@/lib/utils/text-formatter';
import { FlashcardViewer } from '@/components/features/FlashcardViewer';
import { GenerateFlashcardsButton } from '@/components/features/GenerateFlashcardsButton';
import { PresentationViewer } from '@/components/features/PresentationViewer';
import { GeneratePresentationButton } from '@/components/features/GeneratePresentationButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiagramViewer } from '@/components/features/DiagramViewer';
import { PracticeQuizViewer } from '@/components/features/PracticeQuizViewer';
import { GenerateDiagramsButton } from '@/components/features/GenerateDiagramsButton';
import { extractKeyPoints, generateConceptMapData } from '@/lib/utils/concept-map-utils';
import { generatePracticeQuestions } from '@/lib/services/practice-questions-generator';
import { Prisma } from '@prisma/client';
import { GenerateAudioButton } from '@/components/features/GenerateAudioButton';
import { InteractiveConceptMapClickable } from '@/components/features/InteractiveConceptMap';
import { InteractiveResultsView } from '@/components/features/InteractiveResultsView';

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  console.log('📊 Loading results for query:', id);

  // ✅ OPTIMIZED: Single database query for all content
  const query = await prisma.query.findUnique({
    where: { id },
    include: {
      researchData: true,
      content: {
        orderBy: { generatedAt: 'asc' },
      },
    },
  });

  if (!query || query.userId !== session.user.id) {
    redirect('/explore');
  }

  // Extract all content types
  const articleContent = query.content.find((c) => c.contentType === 'article');
  const audioContent = query.content.find((c) => c.contentType === 'audio');
  const presentationContent = query.content.find((c) => c.contentType === 'presentation');
  const flashcardContent = query.content.find((c) => c.contentType === 'flashcards');
  const diagramContent = query.content.find((c) => c.contentType === 'diagrams');
  const quizContent = query.content.find((c) => c.contentType === 'quiz');
  const conceptMapContent = query.content.find((c) => c.contentType === 'concept-map');
  
  const conceptMapData = conceptMapContent?.data || null;
  const article = articleContent?.data as any;
  const articleText = (article?.text as string) || (query.researchData as any)?.rawData?.content || '';

  // ✅ CHECK CACHED STATUS - No regeneration
  //const hasAudioContent = audioContent && audioContent.storageUrl;
  const hasAudioContent = !!audioContent?.storageUrl;
  const presentationData = presentationContent?.data as any;
  const hasPresentationData = presentationData?.status === 'completed' && presentationData?.presentation;
  
  const flashcardData = flashcardContent?.data as any;
  const hasFlashcards = flashcardData?.status === 'completed' && flashcardData?.deck;
  
  const diagramData = diagramContent?.data as any;
  const hasDiagrams = diagramData?.status === 'completed' && diagramData?.diagrams;

  const quizData = quizContent?.data as any;
  const hasQuiz = quizData?.status === 'completed' && quizData?.quiz;

  console.log('✅ Content status (loaded from DB):');
  console.log('  - Article:', !!articleContent);
  console.log('  - Audio:', hasAudioContent ? 'exists' : 'not found');
  console.log('  - Presentation:', hasPresentationData ? 'cached' : 'not generated');
  console.log('  - Flashcards:', hasFlashcards ? 'cached' : 'not generated');
  console.log('  - Diagrams:', hasDiagrams ? 'cached' : 'not generated');
  console.log('  - Quiz:', hasQuiz ? 'cached' : 'not generated');

  // ✅ Generate and CACHE quiz if not exists
   let quiz = hasQuiz ? quizData.quiz : null;
  // if (!quiz && articleText) {
  //   try {
  //     console.log('🎯 Generating quiz on server...');
  //     quiz = await generatePracticeQuestions(query.queryText, articleText, 10);
  //     console.log('✅ Quiz generated on server:', quiz.questions.length, 'questions');

  //     // ✅ SAVE QUIZ TO DATABASE (so it's cached)
  //     await prisma.content.create({
  //       data: {
  //         queryId: id,
  //         contentType: 'quiz',
  //         title: `${query.queryText} - Practice Quiz`,
  //         data: {
  //           status: 'completed',
  //           quiz: quiz as Prisma.InputJsonValue,
  //         } as Prisma.InputJsonValue,
  //       },
  //     });
  //     console.log('💾 Quiz saved to database for future use');
  //   } catch (error) {
  //     console.error('❌ Quiz generation failed:', error);
  //   }
  // }

  // Generate concept map data on server (only if we have article)
  // let conceptMapData = null;
  // if (articleText) {
  //   const keyPoints = extractKeyPoints(articleText, 6);
  //   conceptMapData = generateConceptMapData(query.queryText, keyPoints);
  // }

  // Get clean text for display
  const rawText = article?.text || (query.researchData as any)?.rawData?.content || '';
  const cleanText = formatForDisplay(rawText);
  
  const shouldShowPresentationButton = !presentationContent || presentationData?.status === 'failed';
  const shouldShowFlashcardButton = !flashcardContent || flashcardData?.status === 'failed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      {/* Header Section - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link href="/explore">
            <Button variant="ghost" size="sm" className="gap-2 mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Back</span>
            </Button>
          </Link>
          
          {/* Title - Responsive Text Size */}
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              {query.queryText}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Level: {query.complexityLevel || 'college'}
            </p>
          </div>
          
          {/* Remove Export/Share buttons - commented out for future use */}
          {/* 
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
          */}
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <InteractiveResultsView
            query={query}
            cleanText={cleanText}
            hasAudioContent={hasAudioContent}
            audioContent={audioContent}
            hasPresentationData={hasPresentationData}
            presentationData={presentationData}
            hasFlashcards={hasFlashcards}
            flashcardData={flashcardData}
            hasDiagrams={hasDiagrams}
            diagramData={diagramData}
            hasQuiz={hasQuiz}
            quiz={quiz}
            conceptMapData={conceptMapData}
            articleText={articleText}
            queryId={id}
          />
        </div>
      </div>
    </div>
  );
}
