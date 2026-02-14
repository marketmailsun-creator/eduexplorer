'use client';
// ============================================================
// FILE: src/components/navigation/MobileNav.tsx — REPLACE EXISTING
// Premium bottom navigation with:
//   • Correct Groups icon (Users2)
//   • Floating pill for active tab
//   • Icon + label with micro-animation
//   • Glassmorphism card style
// ============================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, BookMarked, TrendingUp, Users2, CircleUserRound } from 'lucide-react';

const TABS = [
  { href: '/explore',   icon: Compass,         label: 'Explore'  },
  { href: '/library',   icon: BookMarked,       label: 'Library'  },
  { href: '/progress',  icon: TrendingUp,       label: 'Progress' },
  { href: '/groups',    icon: Users2,           label: 'Groups'   },
  { href: '/profile',   icon: CircleUserRound,  label: 'Profile'  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Spacer so content isn't hidden behind nav */}
      <div className="h-20 md:hidden" />

      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-50"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {TABS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 group
                           relative focus:outline-none"
              >
                {/* Active pill background */}
                {active && (
                  <span
                    className="absolute top-0 inset-x-1 h-8 rounded-full
                               bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"
                  />
                )}

                {/* Icon container */}
                <span
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                               transition-all duration-200
                               ${active
                                 ? 'scale-110'
                                 : 'scale-100 group-hover:scale-105'
                               }`}
                >
                  <Icon
                    strokeWidth={active ? 2.5 : 1.8}
                    className={`h-5 w-5 transition-all duration-200
                                 ${active
                                   ? 'text-indigo-600'
                                   : 'text-gray-400 group-hover:text-gray-600'
                                 }`}
                  />
                </span>

                {/* Label */}
                <span
                  className={`text-[10px] font-semibold tracking-tight transition-all duration-200
                               ${active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`}
                >
                  {label}
                </span>

                {/* Active dot */}
                {active && (
                  <span className="w-1 h-1 rounded-full bg-indigo-500 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
