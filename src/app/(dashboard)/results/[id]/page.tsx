import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, BookOpen, FileText } from 'lucide-react';
import Link from 'next/link';
import { AudioPlayerSection } from '@/components/features/AudioPlayerSection';
import { VideoPlayerSection } from '@/components/features/VideoPlayerSection';


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

  const articleContent = query.content.find((c) => c.contentType === 'article');
  const audioContent = query.content.find((c) => c.contentType === 'audio');
  const videoContent = query.content.find((c) => c.contentType === 'video');

  const article = articleContent?.data as any;
  const videoData = videoContent?.data as any;

  // Get article text from research data if content generation is still pending
  const articleText = article?.text || (query.researchData as any)?.rawData?.content || '';

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
                Level: {query.complexityLevel || 'elementary'}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)] w-full">
            
            {/* LEFT COLUMN - Content with FIXED HEIGHT and SCROLL */}
            <div className="flex flex-col gap-6 h-[calc(100vh-12rem)] min-h-0 overflow-hidden">
              
              {/* Comprehensive Explanation - FIXED HEIGHT WITH SCROLL */}
              <div className="bg-white rounded-xl shadow-sm p-6 flex-none h-[55%] min-h-0 flex flex-col">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 flex-shrink-0">
                  <BookOpen className="h-5 w-5" />
                  Comprehensive Explanation
                </h3>
                {/* SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-0">
                  {articleText ? (
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {articleText}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-sm">Content is being generated...</p>
                  )}
                </div>
              </div>

              {/* Sources & References */}
              {query.researchData && (query.researchData.sources as any[])?.length > 0 && (
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
              )}

              {/* Quick Summary */}
              {query.researchData && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Quick Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {query.researchData.summary}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - Media Players */}
            <div className="flex flex-col gap-6 h-full min-h-0">
              
              {/* Audio Player - 30% */}
              <div style={{ height: '30%', minHeight: '200px' }}>
                <AudioPlayerSection audioContent={audioContent} />
              </div>

              {/* Video Player - 70% */}
              <div className="flex-1" style={{ minHeight: '300px' }}>
                <VideoPlayerSection videoContent={videoContent} videoData={videoData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
