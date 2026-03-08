import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import GroupsList from './GroupsList';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface GroupWithDetails {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  creatorName: string | null;
  memberCount: number;
  userRole: string;
}

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userGroups = await prisma.studyGroup.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      creator: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { members: true },
      },
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const groups: GroupWithDetails[] = userGroups.map((group: any) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    isPublic: group.isPublic,
    creatorName: group.creator.name,
    memberCount: group._count.members,
    userRole: group.members[0]?.role || 'member',
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Gradient hero header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600
                      px-6 pt-10 pb-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
          <div className="absolute top-16 -left-4 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">Study Groups</h1>
          <p className="text-purple-200 text-sm">Collaborate and learn together</p>
        </div>
      </div>

      {/* Content overlapping the header */}
      <div className="max-w-6xl mx-auto px-4 -mt-10">
        {/* Action buttons */}
        <div className="flex gap-3 mb-6 relative z-10">
          <Link href="/groups/create">
            <Button className="bg-white text-purple-700 hover:bg-purple-50 border border-purple-200 shadow-sm font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </Link>
          <Link href="/groups/join">
            <Button variant="outline" className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Join Group
            </Button>
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Groups Yet</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Create or join a study group to start collaborating with others
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/groups/create">
                <Button>Create Group</Button>
              </Link>
              <Link href="/groups/join">
                <Button variant="outline">Join Group</Button>
              </Link>
            </div>
          </div>
        ) : (
          <GroupsList groups={groups} />
        )}
      </div>
    </div>
  );
}
