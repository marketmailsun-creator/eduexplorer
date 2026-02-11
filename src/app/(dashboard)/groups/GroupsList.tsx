'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define proper interface
interface Group {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  creatorName: string | null;
  memberCount: number;
  userRole: string;
}

interface GroupsListProps {
  groups: Group[];
}

export default function GroupsList({ groups }: GroupsListProps) {
  //const router = useRouter();

  // Auto-refresh when component mounts
  // useEffect(() => {
  //   router.refresh();
  // }, [router]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group: Group) => (
        <Card key={group.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg">{group.name}</h3>
              {group.isPublic ? (
                <Globe className="h-4 w-4 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
            </div>

            {group.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {group.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
              </span>
              {group.userRole === 'admin' && (
                <span className="text-purple-600 font-medium">Admin</span>
              )}
            </div>

            <Link href={`/groups/${group.id}`}>
              <Button className="w-full" variant="outline">
                View Group
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}