'use client';

import { Home, Search, BookOpen, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/library', icon: BookOpen, label: 'Library' },
    { href: '/progress',  icon: TrendingUp,  label: 'Progress' },  // ← NEW
    { href: '/groups', icon: User, label: 'Groups' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
                isActive ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}