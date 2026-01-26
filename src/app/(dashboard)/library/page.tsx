import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function LibraryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const savedContent = await prisma.savedContent.findMany({
    where: { userId: session.user.id },
    include: { content: true },
    orderBy: { savedAt: 'desc' },
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">My Library</h1>

      {savedContent.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No saved content yet. Start exploring topics to save them here!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {savedContent.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.content.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {item.notes && <p className="text-sm mb-2">{item.notes}</p>}
                {item.tags.length > 0 && (
                  <div className="flex gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-secondary px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}