'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateFlashcardsButtonProps {
  queryId: string;
}

export function GenerateFlashcardsButton({ queryId }: GenerateFlashcardsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/content/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, cardCount: 15 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flashcards');
      }

      console.log('✅ Flashcards generated:', data);

      // Refresh the page to show the flashcards
      router.refresh();
    } catch (err) {
      console.error('❌ Flashcard generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGenerate}
        disabled={loading}
        size="lg"
        variant="outline"
        className="w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Flashcards...
          </>
        ) : (
          <>
            <Layers className="mr-2 h-5 w-5" />
            Generate Flashcards
          </>
        )}
      </Button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
