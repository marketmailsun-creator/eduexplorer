'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';

// Define interface for public groups
interface PublicGroup {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

export default function JoinGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [publicGroups, setPublicGroups] = useState<PublicGroup[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);

  // Fetch public groups
  useEffect(() => {
    fetchPublicGroups();
  }, []);

  const fetchPublicGroups = async () => {
    try {
      const response = await fetch('/api/groups/public');
      if (response.ok) {
        const data = await response.json();
        setPublicGroups(data.groups || []);
      }
    } catch (err) {
      console.error('Failed to fetch public groups:', err);
    } finally {
      setLoadingPublic(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      router.push('/groups');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join group';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPublic = async (groupId: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/groups/join-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      router.push('/groups');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join group';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <Link
        href="/groups"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Groups
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Join by Invite Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Join with Invite Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinByCode} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium mb-2">
                  Invite Code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-lg tracking-wider"
                  placeholder="ABC1234XYZ"
                  maxLength={10}
                />
              </div>

              <Button type="submit" disabled={loading || !inviteCode.trim()} className="w-full">
                {loading ? 'Joining...' : 'Join Group'}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Enter the 10-character code shared by the group admin
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Public Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Public Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPublic ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : publicGroups.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No public groups available
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {publicGroups.map((group: PublicGroup) => (
                  <div
                    key={group.id}
                    className="p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <h4 className="font-medium mb-1">{group.name}</h4>
                    {group.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleJoinPublic(group.id)}
                        disabled={loading}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}