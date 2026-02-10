import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import GroupsList from './GroupsList';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define the group type
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

  // Fetch user's groups
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
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
      members: {
        where: {
          userId: session.user.id,
        },
        select: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Map to proper type
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
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">Study Groups</h1>
        <p className="text-gray-600">Collaborate and learn with others</p>
      </div>

      <div className="flex gap-3 mb-6">
        <Link href="/groups/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </Link>
        <Link href="/groups/join">
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Join Group
          </Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-6 py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
            <p className="text-gray-600 mb-6">
              Create or join a study group to collaborate with others
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/groups/create">
                <Button>Create Group</Button>
              </Link>
              <Link href="/groups/join">
                <Button variant="outline">Join Group</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <GroupsList groups={groups} />
      )}
    </div>
  );
}