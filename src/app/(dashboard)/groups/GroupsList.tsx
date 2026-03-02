'use client';

import { Users, Lock, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  creatorName: string | null;
  memberCount: number;
  userRole: string;
}

interface GroupsListProps {
  groups: Group[];
}

const GROUP_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
];

function getGroupGradient(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GROUP_GRADIENTS[hash % GROUP_GRADIENTS.length];
}

function GroupInitial({ name, gradient }: { name: string; gradient: string }) {
  return (
    <div
      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient}
                  flex items-center justify-center flex-shrink-0`}
    >
      <span className="text-white font-bold text-lg">
        {name.trim()[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  );
}

export default function GroupsList({ groups }: GroupsListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => {
        const gradient = getGroupGradient(group.name);
        return (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            className="group block bg-white rounded-2xl border border-gray-100
                       shadow-sm hover:shadow-md transition-all duration-200
                       hover:-translate-y-0.5 overflow-hidden"
          >
            {/* Colored top strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <GroupInitial name={group.name} gradient={gradient} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                    {group.isPublic ? (
                      <Globe className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  {group.creatorName && (
                    <p className="text-xs text-gray-400 mt-0.5">by {group.creatorName}</p>
                  )}
                </div>
              </div>

              {group.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                  {group.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  {group.userRole === 'admin' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full
                                     bg-purple-100 text-purple-700">
                      Admin
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500
                                           transition-colors" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
