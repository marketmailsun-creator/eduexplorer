'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, Zap, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateQuizButtonProps {
  queryId: string;
  numQuestions?: number;
}

export function GenerateQuizButton({ queryId, numQuestions = 10 }: GenerateQuizButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/content/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          queryId,
          numQuestions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle plan limit errors
        if (response.status === 403) {
          if (data.error?.includes('Upgrade to Pro')) {
            setError(data.error);
            setTimeout(() => {
              if (confirm('Upgrade to Pro for unlimited quizzes?')) {
                router.push('/pricing');
              }
            }, 100);
            return;
          }
        }
        throw new Error(data.error || 'Failed to generate quiz');
      }

      // Success - reload page to show quiz
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
        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Quiz...
          </>
        ) : (
          <>
            <Brain className="mr-2 h-4 w-4" />
            Generate Practice Quiz
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        <Zap className="h-3 w-3 inline mr-1" />
        Free: 1 quiz per topic
        <span className="mx-2">•</span>
        <Crown className="h-3 w-3 inline mr-1" />
        Pro: Unlimited quizzes
      </p>
    </div>
  );
}
