'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, RefreshCw } from 'lucide-react';

interface GenerateAudioButtonProps {
  queryId: string;
}

export function GenerateAudioButton({ queryId }: GenerateAudioButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🎵 Generating audio for query:', queryId);

      const response = await fetch('/api/content/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate audio');
      }

      console.log('✅ Audio generated successfully');
      
      // Reload page to show new audio
      window.location.reload();
    } catch (err) {
      console.error('❌ Audio generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        size="sm"
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Generating Audio...
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" />
            Generate Audio Narration
          </>
        )}
      </Button>

      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
