'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Headphones, Crown, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateAudioButtonProps {
  queryId: string;
}

export function GenerateAudioButton({ queryId }: GenerateAudioButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');

    try {
      // First, get the article content
      const queryResponse = await fetch(`/api/query/${queryId}`);
      if (!queryResponse.ok) {
        throw new Error('Failed to fetch query data');
      }
      
      const queryData = await queryResponse.json();
      const articleContent = queryData.content.find((c: any) => c.contentType === 'article');
      
      if (!articleContent) {
        throw new Error('Article content not found');
      }

      // Generate audio with plan limit checking
      const response = await fetch('/api/content/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contentId: articleContent.id,
          queryId: queryId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle plan limit errors with upgrade prompts
        if (response.status === 403) {
          if (data.error?.includes('Upgrade to Pro')) {
            // Free user hit limit
            setError(data.error);
            setTimeout(() => {
              if (confirm('Upgrade to Pro to generate more audio? You\'ll get 5 audio generations per topic plus on-demand generation.')) {
                router.push('/pricing');
              }
            }, 100);
            return;
          } else if (data.error?.includes('on-demand')) {
            // Free user trying to regenerate
            setError('Audio already generated. Upgrade to Pro for on-demand audio generation.');
            setTimeout(() => {
              if (confirm('Upgrade to Pro for on-demand audio generation?')) {
                router.push('/pricing');
              }
            }, 100);
            return;
          }
        }
        throw new Error(data.error || 'Failed to generate audio');
      }

      // Success - reload page to show new audio
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Audio...
          </>
        ) : (
          <>
            <Headphones className="mr-2 h-4 w-4" />
            Generate Audio
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        <Zap className="h-3 w-3 inline mr-1" />
        Free: 1 audio per topic
        <span className="mx-2">•</span>
        <Crown className="h-3 w-3 inline mr-1" />
        Pro: 5 audio + on-demand
      </p>
    </div>
  );
}
