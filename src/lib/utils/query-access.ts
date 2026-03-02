import { prisma } from '@/lib/db/prisma';

export type AccessType = 'owner' | 'group' | 'challenge' | 'denied';

export interface QueryAccessResult {
  type: AccessType;
  // For group access
  sharedByUser?: { name: string | null; image: string | null };
  groupName?: string;
  // For challenge access
  challengeId?: string;
  challengerName?: string | null;
  challengeeName?: string | null;
}

/**
 * Determines whether a user has access to a query's results page,
 * and what type of access they have.
 *
 * Returns:
 *   'owner'     — user owns the query (full access + generate buttons)
 *   'group'     — user is a member of a group where this content was shared (read-only)
 *   'challenge' — user is a challenger/challengee on an active challenge for this query (read-only + quiz submit)
 *   'denied'    — no access
 */
export async function getQueryAccess(
  userId: string,
  queryId: string
): Promise<QueryAccessResult> {
  const query = await prisma.query.findUnique({
    where: { id: queryId },
    select: { userId: true },
  });

  if (!query) return { type: 'denied' };
  if (query.userId === userId) return { type: 'owner' };

  // Check group membership: is this query's content shared in a group the user belongs to?
  const groupAccess = await prisma.groupSharedContent.findFirst({
    where: {
      content: { queryId },
      group: { members: { some: { userId } } },
    },
    include: {
      user: { select: { name: true, image: true } },
      group: { select: { name: true } },
    },
  });

  if (groupAccess) {
    return {
      type: 'group',
      sharedByUser: { name: groupAccess.user.name, image: groupAccess.user.image },
      groupName: groupAccess.group.name,
    };
  }

  // Check challenge access: is this user a challenger or challengee for a challenge on this query?
  const challengeAccess = await prisma.challenge.findFirst({
    where: {
      queryId,
      OR: [{ challengerId: userId }, { challengeeId: userId }],
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
    include: {
      challenger: { select: { name: true } },
      challengee: { select: { name: true } },
    },
  });

  if (challengeAccess) {
    return {
      type: 'challenge',
      challengeId: challengeAccess.id,
      challengerName: challengeAccess.challenger.name,
      challengeeName: challengeAccess.challengee.name,
    };
  }

  return { type: 'denied' };
}
