'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function TopicDiscoveryHub() {
  const router = useRouter();
  const [recentTopics, setRecentTopics] = useState<{ id: string; topic: string }[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<{ full: string; display: string }[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    fetch('/api/query/trending')
      .then(r => r.ok ? r.json() : { topics: [] })
      .then(({ topics }) => {
        const cleaned = (topics as string[])
          .filter(Boolean)
          .map((t: string) => ({
            full: t,
            display: t.length > 40 ? t.slice(0, 37) + '…' : t,
          }))
          .slice(0, 6);
        setTrendingTopics(cleaned);
      })
      .catch(() => {})
      .finally(() => setTrendingLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/query/history')
      .then(r => r.ok ? r.json() : { queries: [] })
      .then(({ queries }) => {
        const items: { id: string; topic: string }[] = [];
        const seen = new Set<string>();
        for (const q of (queries ?? []).slice(0, 20)) {
          const t = (q.topicDetected || q.queryText || '').trim();
          if (t && !seen.has(t)) {
            seen.add(t);
            items.push({
              id: q.id,
              topic: t.length > 35 ? t.slice(0, 35) + '…' : t,
            });
            if (items.length >= 5) break;
          }
        }
        setRecentTopics(items);
      })
      .catch(() => {});
  }, []);

  const navigateTrending = (full: string) => {
    router.push(`/explore?q=${encodeURIComponent(full)}`, { scroll: false });
    setTimeout(() => {
      document.getElementById('explore-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="w-full mb-8 space-y-6">
      {/* Trending Now — platform-wide popular topics */}
      {(trendingLoading || trendingTopics.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            🔥 Trending Now
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {trendingLoading
              ? [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex-shrink-0 h-8 w-24 rounded-full bg-orange-100 animate-pulse" />
                ))
              : trendingTopics.map(item => (
                  <button
                    key={item.full}
                    onClick={() => navigateTrending(item.full)}
                    className="flex-shrink-0 px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-orange-50 to-amber-50
                               border border-orange-200 rounded-full text-orange-700
                               hover:from-orange-100 hover:to-amber-100 hover:border-orange-400
                               transition-colors shadow-sm"
                  >
                    {item.display}
                  </button>
                ))
            }
          </div>
        </div>
      )}

      {/* Continue Exploring — user's recent results */}
      {recentTopics.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            📚 Continue Exploring
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {recentTopics.map(({ id, topic }) => (
              <button
                key={id}
                onClick={() => router.push(`/results/${id}`)}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-50 to-indigo-50
                           border border-purple-200 rounded-full text-purple-700
                           hover:from-purple-100 hover:to-indigo-100 hover:border-purple-400
                           transition-colors shadow-sm"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
