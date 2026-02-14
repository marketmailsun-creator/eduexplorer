// ============================================================
// FILE: src/app/(dashboard)/library/page.tsx  — REPLACE EXISTING
// ============================================================

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Headphones } from 'lucide-react';
import Link from 'next/link';
import { EmptyLibrary } from '@/components/features/EmptyLibrary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const savedQueries = await prisma.savedQuery.findMany({
    where: { userId: session.user.id },
    include: {
      query: {
        include: { content: { select: { contentType: true } } },
      },
    },
    orderBy: { savedAt: 'desc' },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Library</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {savedQueries.length > 0
                ? `${savedQueries.length} saved topic${savedQueries.length !== 1 ? 's' : ''}`
                : 'Your saved learning materials'}
            </p>
          </div>
          {savedQueries.length > 0 && (
            <Link
              href="/explore"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              + Explore
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {savedQueries.length === 0 ? (
          <EmptyLibrary userName={user?.name ?? ''} />
        ) : (
          <div className="space-y-3">
            {savedQueries.map((saved) => {
              const hasAudio = saved.query.content.some(c => c.contentType === 'audio');
              const hasQuiz  = saved.query.content.some(c => c.contentType === 'quiz');
              const hasFlash = saved.query.content.some(c => c.contentType === 'flashcards');

              return (
                <div
                  key={saved.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm
                             hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-4 sm:p-5">
                    <Link
                      href={`/results/${saved.query.id}`}
                      className="block group"
                    >
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700
                                     transition-colors line-clamp-2 text-sm sm:text-base leading-snug">
                        {saved.query.queryText}
                      </h3>
                    </Link>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="text-xs text-gray-400">
                        Saved {new Date(saved.savedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                      {hasAudio && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50
                                         text-purple-700 border border-purple-100 font-medium">
                          🎧 Audio
                        </span>
                      )}
                      {hasQuiz && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50
                                         text-blue-700 border border-blue-100 font-medium">
                          🧩 Quiz
                        </span>
                      )}
                      {hasFlash && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50
                                         text-green-700 border border-green-100 font-medium">
                          🎴 Flashcards
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/results/${saved.query.id}`}
                        className="flex-1 text-center py-2 rounded-xl bg-indigo-50 text-indigo-700
                                   text-xs font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        Continue Learning →
                      </Link>
                      {hasAudio && (
                        <Link
                          href={`/results/${saved.query.id}#audio`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50
                                     text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
                        >
                          <Headphones className="h-3.5 w-3.5" />
                          Listen
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
