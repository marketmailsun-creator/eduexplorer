'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AudioContent {
  id: string;
  storageUrl: string | null;
  data?: any;
}

interface AudioPlayerSectionProps {
  audioContent?: AudioContent | null;
  queryId?: string;
}

export function AudioPlayerSection({ audioContent, queryId }: AudioPlayerSectionProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const audioUrl = audioContent?.storageUrl || null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    console.log('🎵 AudioPlayer mounted with URL:', audioUrl);

    const handleLoadedMetadata = () => {
      console.log('✅ Audio metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsReady(true);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      console.log('▶️ Audio playing');
      setIsPlaying(true);
      setError(null);
    };

    const handlePause = () => {
      console.log('⏸️ Audio paused');
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log('⏹️ Audio ended');
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('❌ Audio error:', e);
      setError('Audio file unavailable');
      setIsReady(false);
    };

    const handleCanPlay = () => {
      console.log('✅ Audio can play');
      setIsReady(true);
      setError(null);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  const handleRegenerateAudio = async () => {
    if (!queryId) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('🔄 Regenerating audio for query:', queryId);
      
      const response = await fetch('/api/content/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          queryId,
          regenerate: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate audio');
      }

      console.log('✅ Audio regenerated successfully');
      
      // Reload the page to get new audio
      window.location.reload();
    } catch (err) {
      console.error('❌ Audio regeneration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (err) {
      console.error('Play error:', err);
      setError('Playback failed');
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.muted = !audio.muted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    
    audio.playbackRate = newSpeed;
    setPlaybackRate(newSpeed);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // If no audio content, show generate button
  if (!audioContent || !audioUrl) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Volume2 className="h-4 w-4" />
            Audio Narration
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Audio narration not available
          </p>
          {queryId && (
            <Button
              onClick={handleRegenerateAudio}
              disabled={isGenerating}
              size="sm"
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Audio
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base">
            <Volume2 className="h-4 w-4" />
            Audio Narration
          </div>
          {queryId && (
            <Button
              onClick={handleRegenerateAudio}
              disabled={isGenerating}
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
            >
              {isGenerating ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs flex items-center justify-between">
            <span>{error}</span>
            {queryId && (
              <Button
                onClick={handleRegenerateAudio}
                disabled={isGenerating}
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="relative">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={!isReady}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isReady
                  ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                  : '#e5e7eb'
              }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{isReady ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Skip controls */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => skip(-10)}
              disabled={!isReady}
              className="h-8 w-8"
              title="Back 10 seconds"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="default"
              onClick={togglePlay}
              disabled={!isReady}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => skip(10)}
              disabled={!isReady}
              className="h-8 w-8"
              title="Forward 10 seconds"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Volume and speed */}
          <div className="flex items-center gap-2">
            {/* Speed control */}
            <Button
              size="sm"
              variant="outline"
              onClick={changeSpeed}
              disabled={!isReady}
              className="h-8 min-w-[50px] text-xs font-semibold"
            >
              {playbackRate}x
            </Button>

            {/* Volume control */}
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                disabled={!isReady}
                className="h-8 w-8"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                disabled={!isReady}
                className="w-16 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                title="Volume"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
