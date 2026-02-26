'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Swords, Loader2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Query {
  id: string;
  queryText: string;
}

interface ChallengeButtonProps {
  groupId: string;
  challengeeId: string;
  challengeeName: string;
  recentQueries: Query[];
}

export function ChallengeButton({
  groupId,
  challengeeId,
  challengeeName,
  recentQueries,
}: ChallengeButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const sendChallenge = async (queryId: string) => {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch('/api/challenge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeeId, queryId, groupId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: `Challenge sent to ${challengeeName}!` });
        router.push(`/challenges/${data.challengeId}`);
      } else {
        toast({ title: data.error ?? 'Failed to send challenge', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (recentQueries.length === 0) return null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="text-xs gap-1"
        onClick={() => setOpen(!open)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <Swords className="h-3 w-3" />
            Challenge
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-20 py-1">
            <p className="text-xs text-gray-500 px-3 py-2 border-b font-medium">
              Choose a topic to challenge {challengeeName}:
            </p>
            {recentQueries.map((q) => (
              <button
                key={q.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 transition-colors truncate"
                onClick={() => sendChallenge(q.id)}
              >
                {q.queryText.substring(0, 55)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
