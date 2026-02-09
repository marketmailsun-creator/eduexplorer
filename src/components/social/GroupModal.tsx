'use client';

import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

export function GroupModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);

  // Create group state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Join group state
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isPublic }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/groups/${data.group.id}`);
        setOpen(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Create group error:', error);
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/groups/${data.group.id}`);
        setOpen(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Join group error:', error);
      alert('Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        New Group
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Study Group</DialogTitle>
            <DialogDescription>
              Create a new group or join an existing one
            </DialogDescription>
          </DialogHeader>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-md transition ${
                mode === 'create'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
            >
              Create Group
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-md transition ${
                mode === 'join'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
            >
              Join Group
            </button>
          </div>

          {mode === 'create' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Group Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Physics Study Group"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will you learn together?"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm">Make this group public</label>
              </div>

              <Button
                onClick={handleCreate}
                disabled={!name.trim() || loading}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Invite Code
                </label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC12XYZ"
                  className="font-mono text-lg"
                  maxLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask a group admin for the invite code
                </p>
              </div>

              <Button
                onClick={handleJoin}
                disabled={inviteCode.length !== 8 || loading}
                className="w-full"
              >
                {loading ? 'Joining...' : 'Join Group'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}