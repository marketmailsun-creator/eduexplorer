'use client';

import { useState } from 'react';
import { Loader2, PlayCircle } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  title?: string;
}

export function VideoPlayer({ videoUrl, status, title = 'Video Explanation' }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (status === 'processing') {
    return (
      <div className="bg-card border rounded-lg p-8 shadow-sm">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          {title}
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            Generating your AI video explanation...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This may take 5-10 minutes
          </p>
        </div>
      </div>
    );
  }

  if (status === 'failed' || !videoUrl) {
    return (
      <div className="bg-card border rounded-lg p-8 shadow-sm">
        <h3 className="font-semibold mb-4">{title}</h3>
        <p className="text-muted-foreground">
          Video generation is currently unavailable. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <PlayCircle className="h-5 w-5" />
        {title}
      </h3>
      
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        <video
          src={videoUrl}
          controls
          className="w-full h-full"
          onLoadedData={() => setIsLoading(false)}
        >
          Your browser does not support video playback.
        </video>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        AI-generated video explanation with professional narration
      </p>
    </div>
  );
}