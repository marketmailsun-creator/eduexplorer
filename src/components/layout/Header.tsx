'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings, Crown, TrendingUp, Menu, X, Users, BookOpen, Compass } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AvatarWithInitials } from '@/components/ui/avatar-with-initials';

export function Header() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/explore" className="text-xl sm:text-2xl font-bold text-purple-600">
          EduExplorer
        </Link>

        {session ? (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/explore">
                  <Compass className="h-4 w-4 mr-1" />
                  Explore
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/library">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Library
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/groups">
                  <Users className="h-4 w-4 mr-1" />
                  Groups
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/leaderboard">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Leaderboard
                </Link>
              </Button>
            </nav>

            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
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

                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">Settings</span>
                      </Link>

                      <hr className="my-2" />

                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
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

            {/* Mobile Navigation Menu */}
            {showMobileMenu && (
              <div className="absolute top-full left-0 right-0 bg-white border-b shadow-lg md:hidden">
                <nav className="container mx-auto px-4 py-4 space-y-2">
                  <Link
                    href="/explore"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Compass className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Explore</span>
                  </Link>

                  <Link
                    href="/library"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Library</span>
                  </Link>

                  <Link
                    href="/groups"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Groups</span>
                  </Link>

                  <Link
                    href="/leaderboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Leaderboard</span>
                  </Link>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
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