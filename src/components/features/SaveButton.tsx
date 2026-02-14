'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';

interface SaveButtonProps {
  queryId: string;
  isSaved?: boolean;
}

export function SaveButton({ queryId, isSaved: initialSaved = false }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const handleToggleSave = async () => {
    setLoading(true);
    try {
      const endpoint = isSaved ? '/api/query/unsave' : '/api/query/save';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      });
      if (!res.ok) throw new Error('Failed');
      setIsSaved(!isSaved);
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
        border-2 transition-all duration-200 select-none focus:outline-none
        active:scale-95 disabled:opacity-60
        ${isSaved
          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:border-indigo-700'
          : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'
        }
      `}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="h-4 w-4 fill-current" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      <span>{isSaved ? 'Saved' : 'Save'}</span>
    </button>
  );
}
