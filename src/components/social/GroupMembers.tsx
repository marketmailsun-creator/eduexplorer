'use client';

import { useState } from 'react';
import { UserMinus, Crown, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GroupMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface GroupMembersProps {
  members: GroupMember[];
  isAdmin: boolean;
  groupId: string;
}

export function GroupMembers({ members, isAdmin, groupId }: GroupMembersProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the group?')) return;

    setRemovingId(memberId);
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      window.location.reload();
    } catch (error) {
      console.error('Remove member error:', error);
      alert('Failed to remove member. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-purple-600" />
          Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <img
                src={member.user.image || '/default-avatar.png'}
                alt={member.user.name || 'User'}
                className="w-10 h-10 rounded-full border-2 border-gray-200"
              />

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">
                    {member.user.name || 'Anonymous'}
                  </p>
                  {member.role === 'admin' && (
                    <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Joined {formatDate(member.joinedAt)}
                </p>
              </div>

              {/* Remove Button (Admin only) */}
              {isAdmin && member.role !== 'admin' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={removingId === member.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {removingId === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No members yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
