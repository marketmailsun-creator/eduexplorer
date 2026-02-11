import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ShareButton from '@/components/social/ShareButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QueryPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch the query
  const query = await prisma.query.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      content: {
        orderBy: {
          generatedAt: 'desc',
        },
      },
    },
  });

  if (!query) {
    notFound();
  }

  // Check if user has access (owner or shared with them via group)
  const hasAccess = query.userId === session.user.id || await checkGroupAccess(query.id, session.user.id);

  if (!hasAccess) {
    redirect('/');
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/library"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">
              {query.queryText}
            </h1>
            {query.topicDetected && (
              <p className="text-gray-600 mb-2">
                Topic: <span className="font-medium">{query.topicDetected}</span>
              </p>
            )}
            <p className="text-sm text-gray-500">
              Created {new Date(query.createdAt).toLocaleDateString()}
              {query.userId !== session.user.id && (
                <> • Shared by {query.user.name || query.user.email}</>
              )}
            </p>
          </div>
          
          {query.userId === session.user.id && (
            <ShareButton queryId={query.id} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {query.content.length === 0 ? (
          <Card>
            <CardContent className="p-6 py-12 text-center">
              <p className="text-gray-500">No content generated yet</p>
            </CardContent>
          </Card>
        ) : (
          query.content.map((content: any) => (
            <Card key={content.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{content.title}</span>
                  <span className="text-sm px-3 py-1 bg-purple-100 text-purple-600 rounded-full">
                    {content.contentType}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content.contentType === 'slides' && (
                  <div className="prose max-w-none">
                    {/* Render slides content */}
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                      {JSON.stringify(content.data, null, 2)}
                    </pre>
                  </div>
                )}
                {content.contentType === 'notes' && (
                  <div className="prose max-w-none">
                    {/* Render notes content */}
                    <div dangerouslySetInnerHTML={{ __html: content.data.html || '' }} />
                  </div>
                )}
                {content.contentType === 'quiz' && (
                  <div>
                    {/* Render quiz */}
                    <p className="text-gray-600">Quiz content</p>
                  </div>
                )}
                <div className="mt-4 text-xs text-gray-500">
                  Generated {new Date(content.generatedAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Helper function to check group access
async function checkGroupAccess(queryId: string, userId: string): Promise<boolean> {
  const sharedContent = await prisma.groupSharedContent.findFirst({
    where: {
      content: {
        queryId,
      },
      group: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  return !!sharedContent;
}