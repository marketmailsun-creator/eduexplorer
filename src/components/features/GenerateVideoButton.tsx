'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GenerateVideoButtonProps {
  queryId: string;
}

export function GenerateVideoButton({ queryId }: GenerateVideoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // Check if video is already being generated on mount
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const response = await fetch(`/api/video/generate?queryId=${queryId}`);
        const data = await response.json();

        console.log('🎬 Initial video status check:', data);

        if (data.status === 'processing') {
          console.log('✅ Video already generating - showing progress');
          setIsGenerating(true);
          setProgress(20); // Start at 20% if already processing
          setStatusMessage('Video generation in progress...');
        }
      } catch (err) {
        console.error('Initial status check error:', err);
      }
    };

    checkInitialStatus();
  }, [queryId]);

  // Poll for video status while generating
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const checkVideoStatus = async () => {
      try {
        const response = await fetch(`/api/video/generate?queryId=${queryId}`);
        const data = await response.json();

        console.log('📹 Video status poll:', data);

        if (data.status === 'processing') {
          setIsGenerating(true);
          // Gradually increase progress (max 90% until actually complete)
          setProgress(prev => {
            const newProgress = Math.min(prev + 3, 90);
            console.log(`📊 Progress: ${newProgress}%`);
            return newProgress;
          });
          
          // Update status message based on progress
          if (progress < 20) {
            setStatusMessage('Starting video generation...');
          } else if (progress < 40) {
            setStatusMessage('Generating script and scenes...');
          } else if (progress < 60) {
            setStatusMessage('Fetching relevant stock footage...');
          } else if (progress < 80) {
            setStatusMessage('Generating voiceover...');
          } else {
            setStatusMessage('Rendering final video...');
          }
        } else if (data.status === 'completed') {
          console.log('✅ Video completed!');
          setProgress(100);
          setStatusMessage('Video ready!');
          setIsGenerating(false);
          // Refresh page to show video
          setTimeout(() => {
            console.log('🔄 Refreshing page to show video');
            router.refresh();
          }, 1500);
        } else if (data.status === 'failed') {
          console.error('❌ Video generation failed');
          setError('Video generation failed. Please try again.');
          setIsGenerating(false);
          setProgress(0);
        } else if (data.status === 'not_started') {
          console.log('ℹ️ Video not started yet');
          setIsGenerating(false);
          setProgress(0);
        }
      } catch (err) {
        console.error('❌ Status check error:', err);
        // Don't set error here - might be temporary network issue
        // Just log and continue polling
      }
    };

    if (isGenerating) {
      console.log('🔄 Starting status polling (every 5 seconds)');
      // Check immediately
      checkVideoStatus();
      // Then check every 5 seconds
      pollInterval = setInterval(checkVideoStatus, 5000);
    }

    return () => {
      if (pollInterval) {
        console.log('🛑 Stopping status polling');
        clearInterval(pollInterval);
      }
    };
  }, [isGenerating, queryId, router, progress]);

  const handleGenerateVideo = async () => {
    console.log('🎬 Generate Video button clicked');
    setLoading(true);
    setError('');
    setProgress(10);
    setStatusMessage('Starting video generation...');

    try {
      console.log('📤 Sending video generation request...');
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queryId }),
      });

      const data = await response.json();
      console.log('📥 Video generation response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

      if (data.status === 'already_exists') {
        console.log('✅ Video already exists');
        setProgress(100);
        setStatusMessage('Video already exists!');
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else if (data.status === 'started' || data.status === 'processing') {
        console.log('✅ Video generation started');
        setLoading(false);
        setIsGenerating(true);
        setProgress(15);
        setStatusMessage('Generating video script...');
      } else {
        console.warn('⚠️ Unexpected status:', data.status);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Video generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate video');
      setLoading(false);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // If video is generating, show progress
  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-blue-200">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Generating Video...</h4>
              <p className="text-sm text-gray-600 mt-1">{statusMessage}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Status Steps */}
          <div className="space-y-2 bg-blue-50 rounded-lg p-4 text-sm">
            <div className={`flex items-center gap-2 transition-colors ${progress >= 15 ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
              {progress >= 15 ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />
              )}
              <span>Generating script</span>
            </div>
            <div className={`flex items-center gap-2 transition-colors ${progress >= 30 ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
              {progress >= 30 ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />
              )}
              <span>Creating scenes</span>
            </div>
            <div className={`flex items-center gap-2 transition-colors ${progress >= 50 ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
              {progress >= 50 ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />
              )}
              <span>Fetching relevant footage</span>
            </div>
            <div className={`flex items-center gap-2 transition-colors ${progress >= 70 ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
              {progress >= 70 ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />
              )}
              <span>Generating voiceover</span>
            </div>
            <div className={`flex items-center gap-2 transition-colors ${progress >= 90 ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
              {progress >= 90 ? (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-current flex-shrink-0" />
              )}
              <span>Rendering video</span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-xs text-yellow-800">
              ⏱️ <strong>Estimated time:</strong> 10-15 minutes
              <br />
              💡 <strong>Tip:</strong> Feel free to explore other content. The video will be ready when you return.
            </p>
          </div>
        </div>

        {/* Add shimmer animation */}
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  // Initial state - show generate button
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
          <Video className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">Generate Explanation Video</h4>
          <p className="text-sm text-gray-600 mt-1">
            Create an AI-generated video with relevant visuals and voiceover
          </p>
        </div>
      </div>

      {/* Features List */}
      <div className="mb-4 bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-start gap-2 text-sm">
          <span className="text-green-600 mt-0.5">✓</span>
          <span className="text-gray-700">Content-relevant stock footage and images</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <span className="text-green-600 mt-0.5">✓</span>
          <span className="text-gray-700">Professional AI voiceover narration</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <span className="text-green-600 mt-0.5">✓</span>
          <span className="text-gray-700">~10 minute comprehensive explanation</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <span className="text-green-600 mt-0.5">✓</span>
          <span className="text-gray-700">Free - powered by open source tools</span>
        </div>
      </div>

      {/* Generation Info */}
      <div className="mb-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-xs text-blue-700">
          ⏱️ <strong>Generation Time:</strong> 10-15 minutes • 
          <strong> Quality:</strong> 1080p HD • 
          <strong> Cost:</strong> Free
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 rounded-lg p-3 border border-red-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        onClick={handleGenerateVideo}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-11"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Starting Generation...
          </>
        ) : (
          <>
            <Video className="mr-2 h-4 w-4" />
            Generate Video Explanation
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Click to generate. You can continue using the site while the video is being created.
      </p>
    </div>
  );
}
