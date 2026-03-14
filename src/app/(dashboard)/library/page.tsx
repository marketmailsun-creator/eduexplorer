import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Headphones, BookOpen } from 'lucide-react';
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
      {/* Gradient hero header */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 px-4 py-5 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">My Library</h1>
                <p className="text-xs text-purple-200 mt-0.5">
                  {savedQueries.length > 0
                    ? `${savedQueries.length} saved topic${savedQueries.length !== 1 ? 's' : ''}`
                    : 'Your saved learning materials'}
                </p>
              </div>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Explore
            </Link>
          </div>
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
              const hasDiagram = saved.query.content.some(c => c.contentType === 'diagrams');
              const hasPresentation = saved.query.content.some(c => c.contentType === 'presentation');

              // Pick strip color based on richest content type
              const stripClass = hasQuiz
                ? 'bg-gradient-to-r from-pink-500 to-rose-500'
                : hasFlash
                ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                : hasAudio
                ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                : 'bg-gradient-to-r from-violet-400 to-indigo-500';

              return (
                <div
                  key={saved.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Top color strip */}
                  <div className={`h-1.5 ${stripClass}`} />

                  <div className="p-4 sm:p-5">
                    {/* Level + Date row */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium capitalize">
                        {saved.query.complexityLevel || 'College'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(saved.savedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: '2-digit',
                        })}
                      </span>
                    </div>

                    <Link
                      href={`/results/${saved.query.id}`}
                      className="block group"
                    >
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700
                                     transition-colors line-clamp-2 text-sm sm:text-base leading-snug">
                        {saved.query.queryText}
                      </h3>
                    </Link>

                    {/* Content badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {hasAudio && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                          🎧 Audio
                        </span>
                      )}
                      {hasQuiz && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100 font-medium">
                          🧩 Quiz
                        </span>
                      )}
                      {hasFlash && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                          🎴 Flashcards
                        </span>
                      )}
                      {hasDiagram && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                          📊 Diagrams
                        </span>
                      )}
                      {hasPresentation && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 font-medium">
                          📑 Slides
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
