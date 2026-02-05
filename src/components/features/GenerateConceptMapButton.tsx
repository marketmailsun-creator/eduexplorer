'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Network } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateConceptMapButtonProps {
  queryId: string;
}

export function GenerateConceptMapButton({ queryId }: GenerateConceptMapButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/content/concept-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate concept map');
      }

      console.log('✅ Concept map generated:', data);

      // Refresh the page to show the concept map
      router.refresh();
    } catch (err) {
      console.error('❌ Concept map generation error:', err);
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
            Generating Concept Map...
          </>
        ) : (
          <>
            <Network className="mr-2 h-5 w-5" />
            Generate Concept Map
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