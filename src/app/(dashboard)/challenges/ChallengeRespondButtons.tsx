'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface ChallengeRespondButtonsProps {
  challengeId: string;
}

export function ChallengeRespondButtons({ challengeId }: ChallengeRespondButtonsProps) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const respond = async (action: 'accept' | 'decline') => {
    setLoading(action);
    try {
      const res = await fetch('/api/challenge/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: action === 'accept' ? 'Challenge accepted!' : 'Challenge declined' });
        router.refresh();
      } else {
        toast({ title: data.error ?? 'Failed to respond', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-7"
        onClick={() => respond('decline')}
        disabled={loading !== null}
      >
        {loading === 'decline' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Decline'}
      </Button>
      <Button
        size="sm"
        className="text-xs h-7 bg-purple-600 hover:bg-purple-700"
        onClick={() => respond('accept')}
        disabled={loading !== null}
      >
        {loading === 'accept' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept'}
      </Button>
    </div>
  );
}
