'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Loader2, BookOpen } from 'lucide-react';

/**
 * Auth Callback Page
 *
 * Intermediate landing page after OAuth (e.g. Google sign-in).
 * Waits for the NextAuth session to fully establish before redirecting.
 *
 * Why this exists: In Capacitor WebView, the session cookie set by a server-side
 * OAuth redirect may not be available immediately when the next page renders.
 * This client component polls `useSession()` and only navigates once the session
 * status is confirmed — preventing the "authenticated but sees login page" loop
 * that occurs on Android when `router.push` runs before cookies are committed.
 */
function AuthCallbackContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/explore';

  useEffect(() => {
    if (status === 'authenticated') {
      // Use window.location.replace (hard navigation) — ensures the Capacitor
      // WebView commits all pending Set-Cookie headers before the next render.
      window.location.replace(next);
    } else if (status === 'unauthenticated') {
      // OAuth failed or session expired — return to login
      window.location.replace('/login');
    }
    // status === 'loading' → keep showing spinner; session is still being fetched
  }, [status, next]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
        <BookOpen className="h-8 w-8 text-white" />
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      <p className="text-sm text-gray-500">Completing sign in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
