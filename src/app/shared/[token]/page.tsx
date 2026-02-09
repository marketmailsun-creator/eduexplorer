import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Calendar, User } from 'lucide-react';
import Link from 'next/link';

interface SharedPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function SharedPage({ params }: SharedPageProps) {
  const { token } = await params;

  // Fetch shared content with query and user
  const sharedContent = await prisma.sharedContent.findUnique({
    where: { shareToken: token },
    include: {
      query: {
        include: {
          content: true,
          researchData: true,
        },
      },
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!sharedContent) {
    notFound();
  }

  // Increment view count
  await prisma.sharedContent.update({
    where: { id: sharedContent.id },
    data: { views: { increment: 1 } },
  });

  const { query, user } = sharedContent;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {query.queryText}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Shared by {user.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(sharedContent.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{sharedContent.views} views</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content */}
        <div className="space-y-6">
          {/* Research Summary */}
          {query.researchData && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {query.researchData.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generated Content */}
          {query.content && query.content.length > 0 && (
            <div className="space-y-4">
              {query.content.map((content) => (
                <Card key={content.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {content.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {content.contentType}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {/* Render content based on type */}
                    {content.contentType === 'article' && (
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: typeof content.data === 'string' 
                            ? content.data 
                            : JSON.stringify(content.data) 
                        }}
                      />
                    )}
                    
                    {content.contentType === 'flashcards' && (
                      <div className="text-sm text-gray-600">
                        Flashcards available in the app
                      </div>
                    )}
                    
                    {content.contentType === 'quiz' && (
                      <div className="text-sm text-gray-600">
                        Quiz available in the app
                      </div>
                    )}

                    {!['article', 'flashcards', 'quiz'].includes(content.contentType) && (
                      <div className="text-sm text-gray-600">
                        Content type: {content.contentType}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Want to create your own?</h3>
            <p className="text-gray-600 mb-4">
              Join EduExplorer to generate AI-powered study materials instantly
            </p>
            <Link
              href="/signup"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Sign Up Free
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SharedPageProps) {
  const { token } = await params;

  const sharedContent = await prisma.sharedContent.findUnique({
    where: { shareToken: token },
    include: {
      query: true,
      user: {
        select: { name: true },
      },
    },
  });

  if (!sharedContent) {
    return {
      title: 'Content Not Found',
    };
  }

  return {
    title: `${sharedContent.query.queryText} - Shared on EduExplorer`,
    description: `Learn about ${sharedContent.query.queryText}. Shared by ${sharedContent.user.name || 'a user'} on EduExplorer.`,
  };
}