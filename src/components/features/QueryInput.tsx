'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  Camera, 
  Paperclip, 
  Mic, 
  X, 
  File, 
  Play, 
  Pause,
  Volume2 
} from 'lucide-react';

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

export function QueryInput() {QueryInput
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('college');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Media attachments
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Handle file selection (documents, images)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    console.log('📎 Files selected:', files.length);

    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).substr(2, 9);
      const isImage = file.type.startsWith('image/');
      
      console.log('📄 Processing file:', file.name, file.type);

      const newFile: AttachedFile = {
        id,
        file,
        type: isImage ? 'image' : 'document',
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setAttachedFiles((prev) => {
            console.log('✅ Image added:', file.name);
            return [...prev, newFile];
          });
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFiles((prev) => {
          console.log('✅ Document added:', file.name);
          return [...prev, newFile];
        });
      }
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handle camera capture
  const handleCameraClick = () => {
    console.log('📸 Camera button clicked');
    cameraInputRef.current?.click();
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 Camera capture triggered');
    handleFileSelect(event);
  };

  // Handle file attachment click
  const handleAttachClick = () => {
    console.log('📎 Attach button clicked');
    fileInputRef.current?.click();
  };

  // Remove file
  const removeFile = (id: string) => {
    console.log('🗑️ Removing file:', id);
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Start audio recording
  const startAudioRecording = async () => {
    console.log('🎤 Starting audio recording...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📊 Audio chunk recorded:', event.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped');
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('✅ Audio blob created:', blob.size, 'bytes');
        
        setAudioBlob(blob);
        
        // Create URL for playback
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        console.log('✅ Audio URL created:', url);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log('🔇 Track stopped');
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('🔴 Recording started');
    } catch (err) {
      console.error('❌ Audio recording error:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  // Stop audio recording
  const stopAudioRecording = () => {
    console.log('⏹️ Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play recorded audio
  const playAudio = () => {
    if (!audioURL) return;
    
    console.log('▶️ Playing audio');
    
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioURL);
      audioPlayerRef.current.onended = () => {
        console.log('⏹️ Playback ended');
        setIsPlayingAudio(false);
      };
    }
    
    audioPlayerRef.current.play();
    setIsPlayingAudio(true);
  };

  // Pause audio
  const pauseAudio = () => {
    console.log('⏸️ Pausing audio');
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  // Remove audio recording
  const removeAudio = () => {
    console.log('🗑️ Removing audio');
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setAudioBlob(null);
    setAudioURL(null);
    setIsPlayingAudio(false);
    audioChunksRef.current = [];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }
    
    setLoading(true);
    setError('');

    console.log('📤 Submitting query...');
    console.log('  - Query:', query);
    console.log('  - Level:', level);
    console.log('  - Files:', attachedFiles.length);
    console.log('  - Audio:', audioBlob ? 'Yes' : 'No');

    try {
      const formData = new FormData();
      formData.append('query', query);
      formData.append('learningLevel', level);

      // Add attached files
      attachedFiles.forEach((attachedFile) => {
        formData.append('files', attachedFile.file);
        console.log('  📎 Adding file:', attachedFile.file.name);
      });

      // Add audio recording
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
        console.log('  🎤 Adding audio recording');
      }

      const response = await fetch('/api/query/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit query');
      }

      console.log('✅ Query submitted successfully:', data.queryId);

      // Redirect to results page
      router.push(`/results/${data.queryId}`);
    } catch (err) {
      console.error('❌ Submit error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Query Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                What would you like to learn?
              </label>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Explain quantum computing..."
                className="min-h-32"
                disabled={loading}
                required
              />
            </div>

            {/* Media Attachments Section */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {/* Camera Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCameraClick}
                  disabled={loading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
                </Button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />

                {/* File Attachment Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAttachClick}
                  disabled={loading}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Audio Recording Button */}
                {!audioBlob && (
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopAudioRecording : startAudioRecording}
                    disabled={loading}
                  >
                    <Mic className={`h-4 w-4 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />
                    {isRecording ? 'Stop Recording' : 'Record Audio'}
                  </Button>
                )}
              </div>

              {/* Display Attached Files */}
              {attachedFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative border rounded-lg p-2 bg-secondary/20"
                    >
                      {file.type === 'image' && file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center bg-secondary rounded">
                          <File className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-xs mt-1 truncate">{file.file.name}</p>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Display Audio Recording with Playback */}
              {audioBlob && (
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Volume2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Audio Recording</p>
                        <p className="text-xs text-blue-700">
                          {(audioBlob.size / 1024).toFixed(2)} KB • Click play to listen
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Play/Pause Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={isPlayingAudio ? pauseAudio : playAudio}
                        className="h-8 w-8"
                      >
                        {isPlayingAudio ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeAudio}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Learning Level */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Learning Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="elementary">Elementary</option>
                <option value="high-school">High School</option>
                <option value="college">College</option>
                <option value="adult">Adult/Professional</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={loading || !query.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                'Explore Topic'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
