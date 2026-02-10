import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CopyInviteCode from './CopyInviteCode';
import GroupMembers from './GroupMembers';
import { prisma } from '@/lib/db/prisma';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewGroupPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch group with members
  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      sharedContent: {
        include: {
          content: {
            select: {
              id: true,
              title: true,
              contentType: true,
              generatedAt: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  });

  if (!group) {
    notFound();
  }

  // Check if user is a member
  const isMember = group.members.some((m: any) => m.userId === session.user.id);
  const isAdmin = group.members.some(
    (m: any) => m.userId === session.user.id && m.role === 'admin'
  );

  if (!isMember) {
    redirect('/groups');
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <Link
        href="/groups"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Groups
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Group Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                {group.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.description && (
                <p className="text-gray-600">{group.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  Created by <strong>{group.creator.name}</strong>
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-400">•</span>
                <span className={group.isPublic ? 'text-green-600' : 'text-gray-600'}>
                  {group.isPublic ? 'Public' : 'Private'}
                </span>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Invite Code</p>
                  <CopyInviteCode code={group.inviteCode} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shared Content */}
          <Card>
            <CardHeader>
              <CardTitle>Shared Content</CardTitle>
            </CardHeader>
            <CardContent>
              {group.sharedContent.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No content shared yet
                </p>
              ) : (
                <div className="space-y-3">
                  {group.sharedContent.map((shared: any) => (
                    <div
                      key={shared.id}
                      className="p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <h4 className="font-medium">{shared.content.title}</h4>
                      <p className="text-sm text-gray-600">
                        Shared by {shared.user.name} •{' '}
                        {new Date(shared.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Members Sidebar */}
        <div>
          <GroupMembers members={group.members} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}