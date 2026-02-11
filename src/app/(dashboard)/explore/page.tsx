import { auth } from '@/auth';
import { SplitLayoutExplore } from '@/components/features/SplitLayoutExplore';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ExplorePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

   return (
    <div className="w-full px-6">
      <div className="max-w-7xl mx-auto w-full">
        <SplitLayoutExplore />
      </div>
    </div>
  );
}
