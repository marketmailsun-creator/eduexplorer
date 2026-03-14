'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  {
    emoji: '🔬',
    label: 'STEM',
    color: 'border-blue-200 hover:bg-blue-50',
    topics: ['Quantum Physics', 'DNA Replication', 'Machine Learning', 'Calculus'],
  },
  {
    emoji: '🌍',
    label: 'History',
    color: 'border-amber-200 hover:bg-amber-50',
    topics: ['World War II', 'Ancient Rome', 'Indian Independence', 'The Renaissance'],
  },
  {
    emoji: '🗣️',
    label: 'Languages',
    color: 'border-green-200 hover:bg-green-50',
    topics: ['English Grammar', 'French Basics', 'Spanish Verbs', 'Latin Roots'],
  },
  {
    emoji: '💰',
    label: 'Finance',
    color: 'border-yellow-200 hover:bg-yellow-50',
    topics: ['Stock Market', 'Compound Interest', 'Mutual Funds', 'GST India'],
  },
  {
    emoji: '🎨',
    label: 'Arts',
    color: 'border-pink-200 hover:bg-pink-50',
    topics: ['Impressionism', 'Music Theory', 'Photography', 'Film Direction'],
  },
  {
    emoji: '💻',
    label: 'Technology',
    color: 'border-purple-200 hover:bg-purple-50',
    topics: ['React.js', 'System Design', 'Cybersecurity', 'Data Structures'],
  },
];

export function TopicDiscoveryHub() {
  const router = useRouter();
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/query/history')
      .then(r => r.ok ? r.json() : { queries: [] })
      .then(({ queries }) => {
        const topics: string[] = [];
        const seen = new Set<string>();
        for (const q of (queries ?? []).slice(0, 20)) {
          const t = (q.topicDetected || q.queryText || '').trim();
          if (t && !seen.has(t)) {
            seen.add(t);
            topics.push(t.length > 35 ? t.slice(0, 35) + '…' : t);
            if (topics.length >= 6) break;
          }
        }
        setRecentTopics(topics);
      })
      .catch(() => {});
  }, []);

  const navigate = (topic: string) => {
    router.push(`/explore?q=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="w-full mb-8 space-y-6">
      {/* Recent for this user */}
      {recentTopics.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            📚 Continue Exploring
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentTopics.map(topic => (
              <button
                key={topic}
                onClick={() => navigate(topic)}
                className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-50 to-indigo-50
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

      {/* Subject categories */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          🗂️ Browse by Subject
        </h2>

        {/* Mobile: horizontal scrollable chip strip */}
        <div className="md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => setExpandedCategory(expandedCategory === cat.label ? null : cat.label)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-colors ${
                  expandedCategory === cat.label
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          {/* Expanded topics for selected category */}
          {expandedCategory && (() => {
            const cat = CATEGORIES.find(c => c.label === expandedCategory);
            return cat ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {cat.topics.slice(0, 3).map(t => (
                  <button
                    key={t}
                    onClick={() => navigate(t)}
                    className="px-3 py-1.5 text-xs bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : null;
          })()}
        </div>

        {/* Desktop: full 6-column grid */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map(cat => (
            <div
              key={cat.label}
              className={`bg-white border rounded-xl p-3 ${cat.color} transition-colors`}
            >
              <div className="text-2xl mb-1">{cat.emoji}</div>
              <div className="font-semibold text-gray-800 text-sm mb-2">{cat.label}</div>
              <div className="space-y-1">
                {cat.topics.slice(0, 3).map(t => (
                  <button
                    key={t}
                    onClick={() => navigate(t)}
                    className="block text-xs text-left text-gray-600 hover:text-purple-700
                               hover:underline w-full truncate"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}