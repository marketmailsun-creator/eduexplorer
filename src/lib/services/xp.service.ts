import { prisma } from '@/lib/db/prisma';

export type XPReason =
  | 'quiz_completion'
  | 'subject_search'
  | 'week_streak_bonus'
  | 'achievement_bonus'
  | 'redemption';

/**
 * Award XP to a user.
 * Updates User.totalXP and creates an XPTransaction atomically.
 * Returns new totalXP.
 */
export async function awardXP(
  userId: string,
  amount: number,
  reason: XPReason,
  metadata?: Record<string, unknown>
): Promise<number> {
  const [, updatedUser] = await prisma.$transaction([
    prisma.xPTransaction.create({
      data: {
        userId,
        amount,
        reason,
        // Prisma Json field requires explicit cast through JSON.parse/stringify
        ...(metadata ? { metadata: JSON.parse(JSON.stringify(metadata)) } : {}),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totalXP: { increment: amount } },
      select: { totalXP: true },
    }),
  ]);
  return updatedUser.totalXP;
}

/**
 * Get current XP balance for a user.
 */
export async function getXPBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXP: true },
  });
  return user?.totalXP ?? 0;
}

/**
 * Get paginated XP transaction history.
 */
export async function getXPHistory(userId: string, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [transactions, total] = await Promise.all([
    prisma.xPTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.xPTransaction.count({ where: { userId } }),
  ]);
  return { transactions, total, page, pageSize };
}

/**
 * Get global XP leaderboard.
 */
export async function getXPLeaderboard(limit = 50) {
  return prisma.user.findMany({
    orderBy: { totalXP: 'desc' },
    take: limit,
    select: { id: true, name: true, image: true, totalXP: true, currentStreak: true },
  });
}

/**
 * Check if user can redeem XP (>= 200 XP, no pending redemption).
 */
export async function canRedeemXP(
  userId: string
): Promise<{ canRedeem: boolean; reason?: string }> {
  const [user, pending] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { totalXP: true } }),
    prisma.xPRedemption.findFirst({ where: { userId, status: 'PENDING' } }),
  ]);
  if (!user || user.totalXP < 200) {
    return { canRedeem: false, reason: 'Need at least 200 XP to redeem' };
  }
  if (pending) {
    return { canRedeem: false, reason: 'You already have a pending redemption request' };
  }
  return { canRedeem: true };
}

/**
 * Submit XP redemption request (200 XP -> Rs.100 Amazon voucher).
 * Deducts 200 XP immediately; creates redemption record.
 */
export async function submitRedemption(
  userId: string
): Promise<{ success: boolean; reason?: string }> {
  const { canRedeem, reason } = await canRedeemXP(userId);
  if (!canRedeem) return { success: false, reason };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { totalXP: { decrement: 200 } },
    }),
    prisma.xPTransaction.create({
      data: { userId, amount: -200, reason: 'redemption', metadata: { type: 'amazon_voucher' } },
    }),
    prisma.xPRedemption.create({
      data: { userId, xpAmount: 200 },
    }),
  ]);

  return { success: true };
}

/**
 * Get all redemptions for a user.
 */
export async function getUserRedemptions(userId: string) {
  return prisma.xPRedemption.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}
