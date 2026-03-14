import { auth } from '@/auth';
import { SplitLayoutExplore } from '@/components/features/SplitLayoutExplore';
import { TopicDiscoveryHub } from '@/components/features/TopicDiscoveryHub';
import { CurriculumSelector } from '@/components/features/CurriculumSelector';
import { UsageBar } from '@/components/features/UsageBar';
import { prisma } from '@/lib/db/prisma';
import { getDailyLessonsUsed } from '@/lib/services/plan-limits.service';
import { redirect } from 'next/navigation';
import ExploreClientWrapper from './ExploreClientWrapper';
import { Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ExplorePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingDone: true, name: true, plan: true }
  });
  const userPlan = (user?.plan as 'free' | 'pro') || 'free';
  const lessonsUsed = await getDailyLessonsUsed(session.user.id);
  const lessonsLimit = userPlan === 'pro' ? 15 : 5;

   return (
    <div className="w-full px-3 sm:px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Page Hero — bold gradient card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-4 py-5 sm:px-10 sm:py-10 mt-3 mb-4 text-white shadow-xl">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Powered Learning Platform</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              Learn Anything,{' '}
              <span className="text-yellow-300">Instantly</span>
            </h1>
            <p className="text-sm sm:text-base text-purple-100 max-w-xl mx-auto mb-4 sm:mb-7">
              Ask any question — get articles, quizzes, audio, flashcards & more in seconds
            </p>
            {/* <div className="flex flex-wrap justify-center gap-1.5 max-w-lg mx-auto mb-4 sm:mb-7">
              {['Article', 'Audio', 'Flashcards', 'Quiz', 'Diagrams', 'Concept Map', 'Presentation'].map(format => (
                <span
                  key={format}
                  className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-medium text-white/90"
                >
                  {format}
                </span>
              ))}
            </div> */}

            {/* Stats row */}
            <div className="flex items-center justify-center gap-4 sm:gap-10">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">5+</div>
                <div className="text-xs sm:text-sm text-purple-200 mt-0.5">Content Formats</div>
              </div>
              <div className="w-px h-10 bg-white/25" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">4</div>
                <div className="text-xs sm:text-sm text-purple-200 mt-0.5">Learning Levels</div>
              </div>
              <div className="w-px h-10 bg-white/25" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">∞</div>
                <div className="text-xs sm:text-sm text-purple-200 mt-0.5">Topics</div>
              </div>
            </div>
          </div>
        </div>

        <UsageBar
          plan={userPlan}
          lessonsUsed={lessonsUsed}
          lessonsLimit={lessonsLimit}
        />
        <CurriculumSelector />
        {/* <TopicDiscoveryHub /> */}
        <SplitLayoutExplore
          onboardingDone={user?.onboardingDone ?? false}
          userName={user?.name ?? ''}
        />
      </div>
    </div>
  );
}
