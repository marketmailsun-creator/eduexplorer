import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getXPHistory, canRedeemXP, getUserRedemptions } from '@/lib/services/xp.service';
import { getStreakInfo } from '@/lib/services/streak.service';
import { XPBar } from '@/components/gamification/XPBar';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { XPRedeemButton } from './XPRedeemButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Gift, Clock, CheckCircle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const REASON_LABELS: Record<string, string> = {
  quiz_completion: 'Quiz Completion',
  subject_search: 'Topic Explored',
  week_streak_bonus: 'Week Streak Bonus',
  achievement_bonus: 'Achievement Unlocked',
  redemption: 'XP Redeemed',
};

export default async function XPPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const [user, streakInfo, { transactions }, { canRedeem, reason: redeemReason }, redemptions] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { totalXP: true } }),
      getStreakInfo(userId),
      getXPHistory(userId, 1, 15),
      canRedeemXP(userId),
      getUserRedemptions(userId),
    ]);

  const totalXP = user?.totalXP ?? 0;

  const statusIcon = (status: string) => {
    if (status === 'APPROVED') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'REJECTED') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="container max-w-3xl py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Zap className="h-7 w-7 fill-yellow-400 stroke-yellow-600" />
        <h1 className="text-2xl font-bold">XP & Rewards</h1>
      </div>

      {/* XP Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-bold text-yellow-600">{totalXP}</p>
              <p className="text-gray-500 text-sm">Total XP earned</p>
            </div>
            <StreakBadge streak={streakInfo.currentStreak} />
          </div>
          <XPBar totalXP={totalXP} />
          <p className="text-xs text-gray-500 mt-2">
            Longest streak: {streakInfo.longestStreak} days
          </p>
        </CardContent>
      </Card>

      {/* Redemption Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-5 w-5 text-purple-600" />
            Redeem XP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-yellow-50 rounded-lg border">
            <div>
              <p className="font-semibold">200 XP = Rs.100 Amazon Voucher</p>
              <p className="text-xs text-gray-500 mt-1">
                Voucher will be emailed within 24 hours of approval. Admin-reviewed.
              </p>
            </div>
            <XPRedeemButton canRedeem={canRedeem} reason={redeemReason} totalXP={totalXP} />
          </div>

          {redemptions.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Past Redemptions
              </p>
              {redemptions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm border rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {statusIcon(r.status)}
                    <span>100 XP</span>
                    {r.voucherCode && (
                      <span className="text-xs text-green-600 font-mono">Code: {r.voucherCode}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-medium ${
                        r.status === 'APPROVED'
                          ? 'text-green-600'
                          : r.status === 'REJECTED'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {r.status}
                    </span>
                    <p className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* XP History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No XP earned yet. Start exploring topics!
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <span className="text-gray-700">
                    {REASON_LABELS[tx.reason] ?? tx.reason}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}{tx.amount} XP
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
