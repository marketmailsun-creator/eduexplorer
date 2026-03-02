import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CapacitorInit } from '@/components/capacitor/CapacitorInit';
import { InactivityBanner } from '@/components/features/InactivityBanner';
import { XPRedemptionBanner } from '@/components/features/XPRedemptionBanner';
import { PhonePromptClient } from '@/components/features/PhonePromptClient';
import { prisma } from '@/lib/db/prisma';
import '../globals.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Compute days inactive for inactivity banner
  let daysInactive = 0;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastActiveDate: true },
    });
    if (user?.lastActiveDate) {
      const diffMs = Date.now() - user.lastActiveDate.getTime();
      daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  } catch {
    // Non-blocking — don't fail layout on error
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CapacitorInit />
      <InactivityBanner daysInactive={daysInactive} />
      <XPRedemptionBanner />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <PhonePromptClient />
    </div>
  );
}
