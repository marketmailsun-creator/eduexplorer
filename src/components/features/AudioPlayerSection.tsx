'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AudioPlayerSectionProps {
  audioContent?: any;
  audioUrl?: string;
  title?: string;
  autoPlay?: boolean;
  queryId?: string; // Add queryId for polling
}

export function AudioPlayerSection({ 
  audioContent, 
  audioUrl, 
 // title = "Audio Playback",
  autoPlay = false,
  queryId
}: AudioPlayerSectionProps) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const actualAudioUrl = audioUrl || audioContent?.storageUrl;

  // Poll for audio if not yet generated
  useEffect(() => {
    console.log('🎤 AudioPlayerSection - Debug Info:');
    console.log('  - audioContent:', audioContent);
    console.log('  - actualAudioUrl:', actualAudioUrl);
    console.log('  - queryId:', queryId);

    if (!actualAudioUrl && queryId && !isChecking) {
      console.log('⏳ Audio not ready, will check in 5 seconds...');
      setIsChecking(true);
      
      const checkAudio = setTimeout(() => {
        console.log('🔄 Refreshing page to check for audio...');
        router.refresh();
        setIsChecking(false);
      }, 5000); // Check every 5 seconds

      return () => clearTimeout(checkAudio);
    }
  }, [actualAudioUrl, queryId, router, isChecking, audioContent]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !actualAudioUrl) return;

    console.log('🎤 Setting up audio:', actualAudioUrl);

    const handleLoadedMetadata = () => {
      console.log('✅ Audio metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoaded(true);
      if (autoPlay) {
        audio.play().catch(e => console.error('Auto-play failed:', e));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      console.log('▶️ Audio playing');
      setIsPlaying(true);
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

    const handleError = (e: any) => {
      console.error('❌ Audio error:', e);
      setIsLoaded(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    audio.playbackRate = playbackRate;

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [actualAudioUrl, autoPlay, playbackRate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error('Play failed:', e));
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!duration || !isFinite(duration)) return 0;
    return (currentTime / duration) * 100;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
      {/* <h3 className="font-semibold text-gray-900 mb-4 text-sm flex-shrink-0">{title}</h3> */}

      {actualAudioUrl ? (
        <div className="flex-1 flex flex-col justify-center">
          <audio 
            ref={audioRef} 
            src={actualAudioUrl} 
            preload="metadata"
          />

          <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
            {/* Time Display */}
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-500">
                {isLoaded ? formatTime(duration) : 'Loading...'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                disabled={!isLoaded}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: isLoaded
                    ? `linear-gradient(to right, #2563eb 0%, #2563eb ${getProgress()}%, #e5e7eb ${getProgress()}%, #e5e7eb 100%)`
                    : '#e5e7eb'
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => skip(-10)}
                  disabled={!isLoaded}
                  className="h-8 w-8"
                  title="Skip back 10s"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={togglePlay}
                  disabled={!isLoaded}
                  className="h-10 w-10 rounded-full border-gray-300"
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
                  disabled={!isLoaded}
                  className="h-8 w-8"
                  title="Skip forward 10s"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={changeSpeed}
                  disabled={!isLoaded}
                  className="h-8 px-3 text-xs font-semibold border-gray-300"
                >
                  {playbackRate}x
                </Button>

                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={toggleMute}
                  disabled={!isLoaded}
                  className="h-8 w-8"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isLoaded && duration > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Duration: {formatTime(duration)} 
                  {duration > 600 && <span className="ml-1">(~{Math.round(duration / 60)} min)</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-gray-400 text-xs">
              {isChecking 
                ? "Checking for audio..." 
                : "Audio narration will appear here after generation"
              }
            </p>
            {isChecking && (
              <p className="text-xs text-gray-500 mt-2">Page will refresh automatically...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
