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

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsReady(true);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Audio file unavailable');
      setIsReady(false);
    };

    const handleCanPlay = () => {
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
      const response = await fetch('/api/content/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      window.location.reload();
    } catch (err) {
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
    <div className="w-full space-y-3 sm:space-y-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center justify-between">
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

      {/* Modern Progress Bar with Waveform Style */}
      <div className="space-y-2">
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden group">
          {/* Progress fill with gradient */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
          
          {/* Interactive slider */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isReady}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          
          {/* Hover indicator */}
          <div 
            className="absolute inset-y-0 left-0 pointer-events-none"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        
        <div className="flex justify-between text-xs sm:text-sm text-gray-600">
          <span className="font-medium tabular-nums">{formatTime(currentTime)}</span>
          <span className="text-gray-400 tabular-nums">{isReady ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>

      {/* Main Controls - Mobile Optimized */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Skip controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => skip(-10)}
            disabled={!isReady}
            className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-purple-50 hover:text-purple-600"
            title="Back 10 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="default"
            onClick={togglePlay}
            disabled={!isReady}
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => skip(10)}
            disabled={!isReady}
            className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-purple-50 hover:text-purple-600"
            title="Forward 10 seconds"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Volume and speed - Hidden on small mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Speed control */}
          <Button
            size="sm"
            variant="outline"
            onClick={changeSpeed}
            disabled={!isReady}
            className="h-8 sm:h-9 min-w-[45px] sm:min-w-[50px] text-xs font-bold hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
          >
            {playbackRate}x
          </Button>

          {/* Volume control - Hidden on very small screens */}
          <div className="hidden xs:flex items-center gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              disabled={!isReady}
              className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-purple-50 hover:text-purple-600"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            {/* Volume slider - Hidden on mobile */}
            <div className="hidden sm:block relative w-20">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                disabled={!isReady}
                className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
