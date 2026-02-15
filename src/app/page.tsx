'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <SpeedInsights/>
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}