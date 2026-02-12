'use client';
// ============================================================
// FILE: src/components/features/ContinueLearning.tsx
// "Continue Learning" strip shown at top of Explore page
// for returning users — pulls from /api/progress/me recentTopics
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ArrowRight, BookOpen, Loader2 } from 'lucide-react';

interface RecentTopic {
  id: string;
  text: string;
  date: string;
}

export function ContinueLearning() {
  const router = useRouter();
  const [topics, setTopics] = useState<RecentTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/progress/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.recentTopics?.length) {
          // Show up to 3 most recent topics
          setTopics(data.recentTopics.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Don't render anything while loading or if no topics
  if (loading || topics.length === 0) return null;

  return (
    <div className="mb-5 sm:mb-6">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <Clock className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Continue Learning
        </span>
      </div>

      {/* Topic Pills */}
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => router.push(`/results/${topic.id}`)}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl
                       bg-white border border-gray-200 shadow-sm
                       hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50
                       transition-all duration-200 text-left"
          >
            {/* Icon */}
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100
                            flex items-center justify-center flex-shrink-0 
                            group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
              <BookOpen className="h-3 w-3 text-indigo-600" />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-indigo-700
                            truncate max-w-[180px] sm:max-w-[220px] transition-colors leading-tight">
                {topic.text}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{topic.date}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-indigo-500
                                    group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
