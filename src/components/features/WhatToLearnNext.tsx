'use client';
// ============================================================
// FILE 1: src/components/features/WhatToLearnNext.tsx
// Add to bottom of src/app/(dashboard)/results/[id]/page.tsx:
//   <WhatToLearnNext queryId={id} currentTopic={query.queryText} />
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface Suggestion {
  topic: string;
  reason: string;
  emoji: string;
}

interface WhatToLearnNextProps {
  queryId: string;
  currentTopic: string;
}

export function WhatToLearnNext({ queryId, currentTopic }: WhatToLearnNextProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/suggestions/${queryId}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch {
        // Silent fail — suggestions are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    // Delay 1s so it doesn't compete with page load
    const t = setTimeout(load, 1000);
    return () => { cancelled = true; clearTimeout(t); };
  }, [queryId]);

  const handleClick = (topic: string) => {
    router.push(`/explore?q=${encodeURIComponent(topic)}`);
  };

  if (loading) {
    return (
      <div className="mt-10 rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="font-bold text-gray-900 text-sm">What to Learn Next</span>
          <Loader2 className="h-3 w-3 animate-spin text-gray-400 ml-1" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-xl bg-white/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions.length) return null;

  return (
    <div className="mt-10 rounded-2xl border border-indigo-100 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-bold text-gray-900">What to Learn Next</h3>
        <span className="ml-auto text-xs text-gray-400 hidden sm:block">AI-suggested topics</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(s.topic)}
            className="group text-left p-4 rounded-xl bg-white border border-gray-100 
                       hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5
                       transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200 inline-block">
              {s.emoji}
            </div>
            <p className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-indigo-700 transition-colors">
              {s.topic}
            </p>
            <p className="text-xs text-gray-400 mt-1 leading-snug line-clamp-2">
              {s.reason}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-indigo-500 
                            opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Explore <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}