'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

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

  const status = propStatus || videoData?.status || 'processing';
  const actualVideoUrl = videoUrl || videoData?.videoUrl || videoContent?.storageUrl;

  if (status === 'processing' || !actualVideoUrl) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm flex-shrink-0">{title}</h3>
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600 text-sm">
            {videoContent === undefined 
              ? "Video explanation will appear here"
              : "Generating your AI video explanation..."
            }
          </p>
          {videoContent !== undefined && (
            <p className="text-gray-400 text-xs mt-2">This may take 5-10 minutes</p>
          )}
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm flex-shrink-0">{title}</h3>
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-6 border border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            Video generation is currently unavailable. Please try again later.
          </p>
        </div>
      </div>
    );
  }

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
        >
          Your browser does not support video playback.
        </video>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center flex-shrink-0">
        AI-generated video explanation with professional narration
      </p>
    </div>
  );
}
