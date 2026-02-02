'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Video as VideoIcon, Info } from 'lucide-react';

interface VideoPlayerSectionProps {
  videoContent?: any;
  videoData?: any;
  videoUrl?: string;
  status?: 'processing' | 'completed' | 'failed';
  title?: string;
}

export function VideoPlayerSection({ 
  videoContent, 
  videoData,
  videoUrl,
  status: propStatus,
  title = "Video Player"
}: VideoPlayerSectionProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Determine video status and URL
  const status = propStatus || videoData?.status || videoContent?.data?.status || 'not_started';
  const actualVideoUrl = videoUrl || videoData?.videoUrl || videoContent?.storageUrl;
  const note = videoData?.note || videoContent?.data?.note;

  useEffect(() => {
    console.log('📹 VideoPlayerSection - Debug Info:');
    console.log('  - videoContent:', videoContent);
    console.log('  - videoData:', videoData);
    console.log('  - status:', status);
    console.log('  - actualVideoUrl:', actualVideoUrl);
    console.log('  - note:', note);
  }, [videoContent, videoData, status, actualVideoUrl, note]);

  // If no video content at all, don't render
  if (!videoContent && !videoData && !videoUrl && status === 'not_started') {
    console.log('📹 VideoPlayerSection: No video - not rendering');
    return null;
  }

  // Check if it's metadata-only (FFmpeg pending)
  const isMetadataOnly = status === 'completed' && 
    note && 
    note.includes('FFmpeg') && 
    note.includes('pending');

  // If metadata only, show as "preparing"
  if (isMetadataOnly) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm flex-shrink-0">{title}</h3>
        <div className="flex-1 flex flex-col items-center justify-center bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
          <Info className="h-12 w-12 text-blue-600 mb-4" />
          <p className="text-gray-700 font-medium mb-2">
            Video Preparation Complete
          </p>
          <p className="text-gray-600 text-sm mb-4">
            Script and scenes are ready. Video rendering with FFmpeg is pending.
          </p>
          <div className="bg-white rounded-lg p-3 border border-blue-200 w-full max-w-md">
            <p className="text-xs text-gray-600 mb-2">
              <strong>Status:</strong> Metadata generated ✓
            </p>
            <p className="text-xs text-gray-600 mb-2">
              <strong>Scenes:</strong> {videoData?.sceneCount || 'N/A'} scenes created
            </p>
            <p className="text-xs text-gray-600">
              <strong>Next step:</strong> FFmpeg video rendering (coming soon)
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-4 italic">
            Note: Full video rendering with FFmpeg is being implemented.
          </p>
        </div>
      </div>
    );
  }

  // Processing state
  if (status === 'processing') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm flex-shrink-0">{title}</h3>
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-700 font-medium mb-2">Generating Your Video...</p>
          <p className="text-gray-500 text-sm">
            This takes 10-15 minutes. Feel free to explore other content.
          </p>
          <div className="mt-4 w-full max-w-xs bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (status === 'failed') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm flex-shrink-0">{title}</h3>
        <div className="flex-1 flex flex-col items-center justify-center bg-red-50 rounded-lg p-6 border border-red-200 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
          <p className="text-gray-700 font-medium mb-2">Video Generation Failed</p>
          <p className="text-gray-500 text-sm">
            Please try generating the video again or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  // Completed with actual video file
  if (status === 'completed' && actualVideoUrl && !isMetadataOnly) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm flex-shrink-0">{title}</h3>
        <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          <video
            src={actualVideoUrl}
            controls
            className="w-full h-full object-contain"
            onLoadedData={() => setIsLoading(false)}
            onError={(e) => console.error('❌ Video error:', e)}
          >
            Your browser does not support video playback.
          </video>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center flex-shrink-0">
          AI-generated video with relevant visuals and voiceover
        </p>
      </div>
    );
  }

  // Don't render if no valid state
  return null;
}
