'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { User, LogOut, Crown, TrendingUp, Menu, X, Users, BookOpen, Compass, Trophy, Swords, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AvatarWithInitials } from '@/components/ui/avatar-with-initials';
import { XPBar } from '@/components/gamification/XPBar';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { PushNotificationSetup } from '@/components/pwa/PushNotificationSetup';

export function Header() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Close menus on any route change (e.g. bottom nav tap)
  const pathname = usePathname();
  useEffect(() => {
    setShowMobileMenu(false);
    setShowDropdown(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  const isActive = (href: string) => pathname.startsWith(href);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/streak')
      .then((r) => r.json())
      .then((data) => setCurrentStreak(data.currentStreak ?? 0))
      .catch(() => {});
    fetch('/api/xp/history?page=1')
      .then((r) => r.json())
      .then(() => {
        // Get totalXP from leaderboard endpoint (includes current user XP)
        fetch('/api/xp/leaderboard')
          .then((r) => r.json())
          .then((lb) => {
            const me = (lb.leaderboard ?? []).find((u: { id: string; totalXP: number }) => u.id === lb.currentUserId);
            if (me) setTotalXP(me.totalXP);
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [session?.user?.id, pathname]);

  return (
    <header className="border-b bg-white shadow-sm relative z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/explore" className="text-xl sm:text-2xl font-bold text-purple-600">
          EduExplorer
        </Link>

        {session ? (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={isActive('/explore') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : ''}
                onClick={() => window.dispatchEvent(new CustomEvent('edu:close-panels'))}
              >
                <Link href="/explore">
                  <Compass className="h-4 w-4 mr-1" />
                  Explore
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className={isActive('/library') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : ''}>
                <Link href="/library">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Library
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className={isActive('/groups') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : ''}>
                <Link href="/groups">
                  <Users className="h-4 w-4 mr-1" />
                  Groups
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className={isActive('/challenges') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : ''}>
                <Link href="/challenges">
                  <Swords className="h-4 w-4 mr-1" />
                  Challenges
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className={isActive('/leaderboard') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : ''}>
                <Link href="/leaderboard">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Leaderboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className={isActive('/achievements') ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : ''}>
                <Link href="/achievements">
                  <Trophy className="h-4 w-4 mr-1" />
                  Badges
                </Link>
              </Button>
            </nav>

            {/* XP & Streak display */}
            {session && (
              <div className="hidden lg:flex items-center gap-2 px-2">
                <StreakBadge streak={currentStreak} />
                <Link href="/xp">
                  <XPBar totalXP={totalXP} compact />
                </Link>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <AvatarWithInitials
                    name={session.user?.name}
                    image={session.user?.image}
                    size="sm"
                  />
                  <span className="text-sm font-medium hidden sm:block">
                    {session.user?.name}
                  </span>
                </button>

                {/* Desktop Dropdown */}
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-20">
                      <div className="px-4 py-2 border-b">
                        <p className="font-semibold text-sm">{session.user?.name}</p>
                        <p className="text-xs text-gray-600">{session.user?.email}</p>
                      </div>

                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User className="h-4 w-4" />
                        <span className="text-sm">Profile</span>
                      </Link>

                      <Link
                        href="/upgrade"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Upgrade to Pro</span>
                      </Link>

                      {/* <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">Settings</span>
                      </Link> */}

                      <hr className="my-2" />

                      <button
                        onClick={() => signOut({ callbackUrl: '/phone-login' })}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors w-full text-left text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Navigation Menu — gradient slide-down panel */}
            {showMobileMenu && (
              <>
                {/* Click-outside overlay — closes menu when tapping outside */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMobileMenu(false)}
                />
              <div className="absolute top-full left-0 right-0 z-40 bg-gradient-to-b from-purple-50 to-white border-b border-purple-100 shadow-xl lg:hidden overflow-y-auto max-h-[80vh]">
                {/* User info section */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-purple-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <AvatarWithInitials
                    name={session.user?.name}
                    image={session.user?.image}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{session.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    (session.user as { plan?: string })?.plan === 'pro'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-purple-100 text-purple-700 border border-purple-200'
                  }`}>
                    {(session.user as { plan?: string })?.plan === 'pro' ? '⭐ Pro' : 'Free'}
                  </span>
                </div>

                <div className="px-3 py-4 space-y-5">
                  {/* Learn section */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2 mb-2">Learn</p>
                    <div className="space-y-1">
                      {[
                        { href: '/explore',   icon: Compass,   label: 'Explore',   bg: 'bg-purple-100', fg: 'text-purple-600' },
                        { href: '/library',   icon: BookOpen,  label: 'Library',   bg: 'bg-blue-100',   fg: 'text-blue-600'   },
                        { href: '/groups',    icon: Users,     label: 'Groups',    bg: 'bg-teal-100',   fg: 'text-teal-600'   },
                      ].map(({ href, icon: Icon, label, bg, fg }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/80 transition-colors"
                          onClick={() => {
                            setShowMobileMenu(false);
                            if (href === '/explore') window.dispatchEvent(new CustomEvent('edu:close-panels'));
                          }}
                        >
                          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-4.5 w-4.5 ${fg}`} style={{ width: '1.1rem', height: '1.1rem' }} />
                          </div>
                          <span className="font-medium text-gray-800 text-sm">{label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Progress section */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2 mb-2">Progress</p>
                    <div className="space-y-1">
                      {[
                        { href: '/challenges',   icon: Swords,     label: 'Challenges',   bg: 'bg-orange-100', fg: 'text-orange-600' },
                        { href: '/leaderboard',  icon: TrendingUp, label: 'Leaderboard',  bg: 'bg-yellow-100', fg: 'text-yellow-600' },
                        { href: '/achievements', icon: Trophy,     label: 'Badges',       bg: 'bg-amber-100',  fg: 'text-amber-600'  },
                      ].map(({ href, icon: Icon, label, bg, fg }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/80 transition-colors"
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`${fg}`} style={{ width: '1.1rem', height: '1.1rem' }} />
                          </div>
                          <span className="font-medium text-gray-800 text-sm">{label}</span>
                        </Link>
                      ))}
                      <Link
                        href="/xp"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/80 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-base leading-none">⚡</span>
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800 text-sm">XP & Rewards</span>
                          {totalXP > 0 && (
                            <span className="ml-2 text-xs font-bold text-yellow-600">{totalXP} XP</span>
                          )}
                        </div>
                        {currentStreak > 0 && (
                          <span className="text-xs font-bold text-orange-500">🔥 {currentStreak}</span>
                        )}
                      </Link>
                    </div>
                  </div>

                  {/* Account section */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2 mb-2">Account</p>
                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/80 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <User className="text-indigo-600" style={{ width: '1.1rem', height: '1.1rem' }} />
                        </div>
                        <span className="font-medium text-gray-800 text-sm">Profile</span>
                      </Link>
                      <Link
                        href="/upgrade"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/80 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <Crown className="text-yellow-600" style={{ width: '1.1rem', height: '1.1rem' }} />
                        </div>
                        <span className="font-medium text-gray-800 text-sm">Upgrade to Pro</span>
                      </Link>
                      {/* Push notifications row */}
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/60">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <Bell className="text-violet-600" style={{ width: '1.1rem', height: '1.1rem' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 mb-1">Notifications</p>
                          <PushNotificationSetup />
                        </div>
                      </div>
                      <button
                        onClick={() => { signOut({ callbackUrl: '/phone-login' }); setShowMobileMenu(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                          <LogOut className="text-red-500" style={{ width: '1.1rem', height: '1.1rem' }} />
                        </div>
                        <span className="font-medium text-red-600 text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/phone-login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}