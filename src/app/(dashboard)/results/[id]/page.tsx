import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { AudioPlayer } from '@/components/features/AudioPlayer';
import { VideoPlayer } from '@/components/features/VideoPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Headphones, Video } from 'lucide-react';

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
  //const videoContent = query.content.find((c) => c.contentType === 'video');

  const article = articleContent?.data as any;
  //const videoData = videoContent?.data as any;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{query.queryText}</h1>
        <p className="text-muted-foreground">
          Learning Level: {query.complexityLevel || 'College'}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Article Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Comprehensive Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                {article?.text ? (
                  <div className="whitespace-pre-wrap">{article.text}</div>
                ) : (
                  <p className="text-muted-foreground">
                    Content is being generated...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>



          {/* Sources Section */}
          {query.researchData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sources & References
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(query.researchData.sources as any[])?.map((source, idx) => (
                    <div key={idx} className="border-l-4 border-primary/30 pl-4">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {source.title}
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        {source.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Right Side (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Audio Player */}
          {audioContent && (
            <AudioPlayer
              audioUrl={audioContent.storageUrl!}
              title="Audio Narration"
              autoPlay={true}
            />
          )}

          {/* Quick Summary */}
          {query.researchData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {query.researchData.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Key Points */}
          <Card>
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
          </Card>
        </div>
      </div>
    </div>
  );
}