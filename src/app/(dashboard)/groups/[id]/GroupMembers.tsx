'use client';

import AvatarImage from '@/components/ui/avatar-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import Image from 'next/image';

// Define proper interfaces
interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface Member {
  id: string;
  role: string;
  user: User;
}

interface GroupMembersProps {
  members: Member[];
  isAdmin: boolean;
}

export default function GroupMembers({ members, isAdmin }: GroupMembersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member: Member) => (
            <div key={member.id} className="flex items-center gap-3">
              {member.user.image ? (
                <AvatarImage
                src={member.user.image}
                alt={member.user.name || 'User'}
                size={32}
                fallbackText={member.user.name || 'User'}
              />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-medium text-sm">
                    {member.user.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{member.user.name}</p>
                {member.role === 'admin' && (
                  <span className="text-xs text-purple-600">Admin</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}