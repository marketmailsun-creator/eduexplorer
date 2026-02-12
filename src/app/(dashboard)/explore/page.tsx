import { auth } from '@/auth';
import { SplitLayoutExplore } from '@/components/features/SplitLayoutExplore';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';
import ExploreClientWrapper from './ExploreClientWrapper';

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
    select: { onboardingDone: true, name: true }
  });

   return (
    <div className="w-full px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* <SplitLayoutExplore /> */}
        <SplitLayoutExplore
          onboardingDone={user?.onboardingDone ?? false}
          userName={user?.name ?? ''}
        />
      </div>
    </div>
  );
}
