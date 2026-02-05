'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { PlanBadge } from '@/components/features/PlanBadge';
import { useEffect, useState } from 'react';

export function Header() {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<'free' | 'pro'>('free');

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/plan')
        .then(res => res.json())
        .then(data => setPlan(data.plan));
    }
  }, [session]);

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          EduExplorer
        </Link>

        {session ? (
          <div className="flex items-center gap-4">
            <PlanBadge plan={plan} />
            <span className="text-sm text-muted-foreground">
              {session.user?.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )  : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}