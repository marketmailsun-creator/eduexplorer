import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { QueryInput } from '@/components/features/QueryInput';

export default async function ExplorePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Explore Any Topic</h1>
        <p className="text-muted-foreground">
          Ask me anything and I'll research it, explain it, and create learning materials for you.
        </p>
      </div>
      <QueryInput />
    </div>
  );
}