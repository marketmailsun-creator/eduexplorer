import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Share2, Settings } from 'lucide-react';
import { ShareGroupContent } from '@/components/social/ShareGroupContent';
import { GroupMembers } from '@/components/social/GroupMembers';


export default async function StudyGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      creator: {
        select: { name: true, image: true },
      },
      members: {
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
      },
      sharedContent: {
        include: {
          content: {
            include: {
              query: true,
            },
          },
          user: {
            select: { name: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!group) {
    redirect('/groups');
  }

  // Check if user is member
  const isMember = group.members.some((m) => m.userId === session.user.id);
  if (!isMember && !group.isPublic) {
    redirect('/groups');
  }

  const isAdmin = group.members.some(
    (m) => m.userId === session.user.id && m.role === 'admin'
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-gray-600 mb-4">{group.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {group.members.length} members
                </div>
                <div>Created by {group.creator.name}</div>
              </div>
            </div>

            {isAdmin && (
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Invite Code */}
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-900 font-medium mb-1">
                  Invite Code
                </p>
                <code className="text-lg font-mono font-bold text-purple-700">
                  {group.inviteCode}
                </code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(group.inviteCode);
                  alert('Invite code copied!');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shared Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shared Materials</CardTitle>
              </CardHeader>
              <CardContent>
                {isMember && <ShareGroupContent groupId={group.id} />}

                <div className="mt-6 space-y-4">
                  {group.sharedContent.map((item) => (
                    <a
                      key={item.id}
                      href={`/results/${item.content.queryId}`}
                      className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={item.user.image || '/default-avatar.png'}
                          alt={item.user.name || 'User'}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {item.content.query.queryText}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Shared by {item.user.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}

                  {group.sharedContent.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No shared content yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members Sidebar */}
          <div>
            <GroupMembers
              members={group.members}
              isAdmin={isAdmin}
              groupId={group.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}