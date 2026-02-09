import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Bookmark } from 'lucide-react';
import Link from 'next/link';

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Get saved queries
  const savedQueries = await prisma.savedQuery.findMany({
    where: { userId: session.user.id },
    include: {
      query: true,
    },
    orderBy: { savedAt: 'desc' },
  });

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">My Library</h1>
        <p className="text-gray-600">Your saved learning materials</p>
      </div>

      {savedQueries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-6">
              No saved content yet. Save queries to access them here!
            </p>
            <Button asChild>
              <Link href="/explore">Start Exploring</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {savedQueries.map((saved) => (
            <Card key={saved.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-purple-600" />
                  {saved.query.queryText}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Saved {new Date(saved.savedAt).toLocaleDateString()}
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/results/${saved.query.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}