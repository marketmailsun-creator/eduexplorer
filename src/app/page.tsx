import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect('/explore');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to EduExplorer
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Your AI-powered learning assistant. Ask any question and get comprehensive, 
            researched explanations with audio narration.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}