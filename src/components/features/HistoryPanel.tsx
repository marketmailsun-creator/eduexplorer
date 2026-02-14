'use client';
// ============================================================
// FILE: src/components/features/HistoryPanel.tsx  (NEW COMPONENT)
// Beautiful history sidebar panel with timeline cards.
// Replace the inline history code in SplitLayoutExplore.tsx:
//
//   {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Trash2, Clock, BookOpen, ChevronRight, Search } from 'lucide-react';

interface HistoryItem {
  id: string;
  queryText: string;
  topicDetected?: string;
  createdAt: string;
  status: string;
}

interface HistoryPanelProps {
  onClose: () => void;
}

function timeAgo(date: string) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60)    return 'Just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  const d = Math.floor(sec / 86400);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
}

// Group items by relative day
function groupByDay(items: HistoryItem[]): { label: string; items: HistoryItem[] }[] {
  const groups: Record<string, HistoryItem[]> = {};
  for (const item of items) {
    const sec = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 1000);
    const label = sec < 86400 ? 'Today'
                : sec < 172800 ? 'Yesterday'
                : sec < 604800 ? 'This week'
                : 'Older';
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  const ORDER = ['Today', 'Yesterday', 'This week', 'Older'];
  return ORDER.filter(l => groups[l]).map(l => ({ label: l, items: groups[l] }));
}

export function HistoryPanel({ onClose }: HistoryPanelProps) {
  const router = useRouter();
  const [items, setItems]         = useState<HistoryItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deletingIds, setDeleting] = useState<Set<string>>(new Set());
  const [search, setSearch]       = useState('');

  useEffect(() => {
    fetch('/api/query/history')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setItems(d.queries || []); })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove from history?')) return;
    setDeleting(prev => new Set(prev).add(id));
    try {
      await fetch(`/api/query/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {}
    finally { setDeleting(prev => { const n = new Set(prev); n.delete(id); return n; }); }
  };

  const filtered = search.trim()
    ? items.filter(i =>
        (i.topicDetected || i.queryText).toLowerCase().includes(search.toLowerCase()))
    : items;

  const groups = groupByDay(filtered);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 z-50
                      bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex-1">
            <h2 className="font-extrabold text-gray-900 text-lg">History</h2>
            <p className="text-xs text-gray-400">{items.length} topic{items.length !== 1 ? 's' : ''} explored</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center
                       hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search history…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400
                         focus:outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">
                {search ? 'No matches found' : 'No history yet'}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {search ? 'Try a different search' : 'Topics you explore will appear here'}
              </p>
            </div>
          ) : (
            groups.map(({ label, items: groupItems }) => (
              <div key={label}>
                {/* Day label */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {groupItems.map(item => (
                    <div key={item.id} className="group relative">
                      <button
                        onClick={() => { router.push(`/results/${item.id}`); onClose(); }}
                        disabled={deletingIds.has(item.id)}
                        className="w-full text-left flex items-start gap-3 p-3.5 pr-10
                                   rounded-xl border border-gray-100 bg-white
                                   hover:border-indigo-200 hover:bg-indigo-50/40
                                   transition-all duration-150 group-hover:shadow-sm
                                   disabled:opacity-50"
                      >
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50
                                        flex items-center justify-center flex-shrink-0 mt-0.5
                                        group-hover:from-indigo-100 group-hover:to-purple-100 transition-colors">
                          <BookOpen className="h-4 w-4 text-indigo-500" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2
                                        group-hover:text-indigo-700 transition-colors leading-snug">
                            {item.topicDetected || item.queryText}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-gray-300 flex-shrink-0" />
                            <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400
                                                  group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={e => handleDelete(item.id, e)}
                        disabled={deletingIds.has(item.id)}
                        className="absolute right-2 top-2 w-7 h-7 rounded-lg
                                   flex items-center justify-center
                                   opacity-0 group-hover:opacity-100
                                   hover:bg-red-50 text-gray-300 hover:text-red-500
                                   transition-all"
                      >
                        {deletingIds.has(item.id)
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2  className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
