import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, BookOpen, FileText ,Presentation, Layers, Brain, BarChart3} from 'lucide-react';
import Link from 'next/link';
import { AudioPlayerSection } from '@/components/features/AudioPlayerSection';
//import { VideoPlayerSection } from '@/components/features/VideoPlayerSection';
import { formatForDisplay } from '@/lib/utils/text-formatter';
import { GenerateVideoButton } from '@/components/features/GenerateVideoButton';
import { FlashcardViewer } from '@/components/features/FlashcardViewer';
import { GenerateFlashcardsButton } from '@/components/features/GenerateFlashcardsButton';

import { PresentationViewer } from '@/components/features/PresentationViewer';
import { GeneratePresentationButton } from '@/components/features/GeneratePresentationButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { DiagramViewer } from '@/components/features/DiagramViewer';
import { PracticeQuizViewer } from '@/components/features/PracticeQuizViewer';
import { generateDiagrams } from '@/lib/services/diagram-generator';
import { generatePracticeQuestions } from '@/lib/services/practice-questions-generator';


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

  // articleText used by generators
  const articleContent = query.content.find((c) => c.contentType === 'article');
  const article = articleContent?.data as any;
  const articleText = (article?.text as string) || (query.researchData as any)?.rawData?.content || '';

  const audioContent = query.content.find((c) => c.contentType === 'audio');
  const hasAudioContent = audioContent && (audioContent.data as any)?.status === 'completed';

  const presentationContent = query.content.find((c) => c.contentType === 'presentation');
  const presentationData = presentationContent?.data as any;
  const hasPresentationData = presentationData?.status === 'completed' && presentationData?.presentation;

  const flashcardContent = query.content.find((c) => c.contentType === 'flashcards');
  const flashcardData = flashcardContent?.data as any;
  const hasFlashcards = flashcardData?.status === 'completed' && flashcardData?.deck;
  
  // Generate diagrams
  const diagrams = await generateDiagrams(query.queryText, articleText, 3);

  // Generate practice questions
  const quiz = await generatePracticeQuestions(query.queryText, articleText, 10);

  //const videoData = videoContent?.data as any;
  //const videoContent = query.content.find((c) => c.contentType === 'video');
  //const hasVideoContent = !!videoContent;
  //const videoStatus = videoData?.status || 'not_started';
  //const shouldShowVideoPlayer = hasVideoContent && (videoStatus === 'completed' || videoStatus === 'processing');
  //const shouldShowGenerateButton = !hasVideoContent || videoStatus === 'not_started' || videoStatus === 'failed';

  // Get article text and clean it from markdown
  const rawText = article?.text || (query.researchData as any)?.rawData?.content || '';
  const cleanText = formatForDisplay(rawText);
  const shouldShowGenerateButton = !presentationContent || presentationData?.status === 'failed';
  // Check video status - DON'T show player if no video
  
  
 

  console.log('🎬 Results Page Debug:');
  console.log('  - Query ID:', id);
  console.log('📊 Results Page Debug:');
  console.log('  - Query ID:', id);
  console.log('  - hasPresentationData:', hasPresentationData);
  console.log('  - audioContent:', audioContent ? 'exists' : 'null');
  console.log('  - shouldShowGenerateButton:', shouldShowGenerateButton);
  console.log('  - audioContent:', audioContent ? 'exists' : 'not found');
  //console.log('  - hasVideoContent:', hasVideoContent);
  //console.log('  - videoStatus:', videoStatus);
  //console.log('  - shouldShowVideoPlayer:', shouldShowVideoPlayer);
  //console.log('  - shouldShowGenerateButton:', shouldShowGenerateButton);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/explore">
              <Button variant="ghost" size="sm" className="gap-2 rounded-lg">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{query.queryText}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Level: {query.complexityLevel || 'college'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 rounded-lg border-gray-300">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-lg border-gray-300">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-8rem)] w-full">
            
            {/* LEFT COLUMN - Content with FIXED HEIGHT and SCROLL */}
            <div className="flex flex-col gap-6 h-[calc(100vh-8rem)] min-h-0 ">
              
              {/* Comprehensive Explanation - FIXED HEIGHT WITH SCROLL */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex-none h-[55%] min-h-0 flex flex-col"> 
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 flex-shrink-0">
                  <BookOpen className="h-5 w-5" />
                  Comprehensive Explanation
                </h3>
                {/* SCROLLABLE CONTENT AREA - CLEANED TEXT */}
                <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-0">
                  {cleanText ? (
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {cleanText}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-sm">Content is being generated...</p>
                  )}
                </div>
              </div>

              {/* Audio Player - 30% - PASS queryId for auto-refresh */}
              {/* <div style={{ height: '35%', minHeight: '200px' }}>
                <AudioPlayerSection 
                  audioContent={audioContent} 
                  queryId={id}
                />
              </div> */}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Audio Playback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <div style={{ height: '35%', minHeight: '200px' }}>
                    <AudioPlayerSection 
                      audioContent={audioContent} 
                      queryId={id}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Visual Diagrams
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DiagramViewer diagrams={diagrams} />
                </CardContent>
              </Card>

              {/* Sources & References */}
              {/* {query.researchData && (query.researchData.sources as any[])?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Sources & References
                  </h3>
                  <div className="space-y-3 max-h-[20vh] overflow-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {(query.researchData.sources as any[]).map((source, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-3 py-1">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline text-sm"
                        >
                          {source.title}
                        </a>
                        {source.snippet && (
                          <p className="text-xs text-gray-600 mt-1">{source.snippet}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              {/* Quick Summary */}
              {/* {query.researchData && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {formatForDisplay(query.researchData.summary)}
                    </p>
                  </div>
                </div>
              )} */}

              {/* Learning Objectives */}
              {/* <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Learning Objectives</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Understand core concepts and definitions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Learn key principles and theories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Explore real-world applications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Avoid common misconceptions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card> */}
            </div>

            {/* RIGHT COLUMN - Media Players */}
            <div className="flex flex-col gap-6 h-full min-h-0"> 
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Study Flashcards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasFlashcards ? (
                    <FlashcardViewer deck={flashcardData.deck} />
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Layers className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-6">
                        Generate flashcards to study key concepts
                      </p>
                      <GenerateFlashcardsButton queryId={id} />
                    </div>
                  )}
                </CardContent>
              </Card>

              

              {/* Video Section - 70% */}
              <div className="flex-1 flex flex-col gap-3" style={{ minHeight: '300px' }}>
                
                
                {/* {shouldShowGenerateButton && (
                  <GenerateVideoButton queryId={id} />
                )}

                
                {shouldShowVideoPlayer && (
                  <div className="flex-1">
                    <VideoPlayerSection 
                      videoContent={videoContent} 
                      videoData={videoData}
                    />
                  </div>
                )} */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Presentation className="h-5 w-5" />
                      Interactive Presentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasPresentationData ? (
                      <PresentationViewer 
                        presentationData={presentationData.presentation}
                        autoPlay={false}
                      />
                    ) : shouldShowGenerateButton ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Presentation className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 mb-6">
                          Generate an interactive presentation with animated slides
                        </p>
                        <GeneratePresentationButton queryId={id} />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Generating presentation...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Practice Quiz
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PracticeQuizViewer quiz={quiz} />
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
