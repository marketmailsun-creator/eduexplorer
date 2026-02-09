import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Calendar, Crown, Settings } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          queries: true,
          savedContent: true,
        },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={user.image || '/default-avatar.png'}
                alt={user.name || 'User'}
                className="w-20 h-20 rounded-full border-2 border-gray-200"
              />
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                {user.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Plan Badge */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className={`h-5 w-5 ${
                    user.plan === 'pro' ? 'text-yellow-500' : 'text-gray-400'
                  }`} />
                  <span className="font-semibold">
                    {user.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </span>
                </div>
                {user.plan !== 'pro' && (
                  <Button asChild size="sm">
                    <Link href="/upgrade">
                      Upgrade to Pro
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {user._count.queries}
                </div>
                <div className="text-sm text-gray-600 mt-1">Queries</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {user._count.savedContent}
                </div>
                <div className="text-sm text-gray-600 mt-1">Saved Items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/library">
                View Library
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/groups">
                My Groups
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/leaderboard">
                Leaderboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}