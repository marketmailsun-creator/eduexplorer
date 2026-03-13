'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface XPRedeemButtonProps {
  canRedeem: boolean;
  reason?: string;
  totalXP: number;
}

export function XPRedeemButton({ canRedeem, reason, totalXP }: XPRedeemButtonProps) {
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const { toast } = useToast();

  const handleRedeem = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/xp/redeem', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: data.message });
        setRedeemed(true);
      } else {
        toast({ title: data.error ?? 'Redemption failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (redeemed) {
    return (
      <span className="text-sm text-green-600 font-medium">Request submitted!</span>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleRedeem}
      disabled={!canRedeem || loading}
      title={!canRedeem ? reason : undefined}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        `Redeem (${totalXP >= 200 ? '200 XP' : `${totalXP}/200`})`
      )}
    </Button>
  );
}
