import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Crown, Share2, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default async function GroupsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get user's groups
  const userGroups = await prisma.studyGroupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });

  const groups = userGroups.map(ug => ug.group);

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">Study Groups</h1>
        <p className="text-gray-600">Collaborate and learn with others</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button asChild>
          <Link href="/groups/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/groups/join">
            <UserPlus className="h-4 w-4 mr-2" />
            Join Group
          </Link>
        </Button>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
            <p className="text-gray-600 mb-6">
              Create or join a study group to collaborate with others
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <Link href="/groups/create">Create Group</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/groups/join">Join Group</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const isAdmin = userGroups.find(
              ug => ug.groupId === group.id && ug.role === 'admin'
            );

            return (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {group.name}
                    {isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {group._count.members} member{group._count.members !== 1 ? 's' : ''}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {group.description || 'No description'}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Code:</span>
                      <code className="px-2 py-1 bg-gray-100 rounded text-purple-600 font-mono">
                        {group.inviteCode}
                      </code>
                    </div>

                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/groups/${group.id}`}>
                        View Group
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}