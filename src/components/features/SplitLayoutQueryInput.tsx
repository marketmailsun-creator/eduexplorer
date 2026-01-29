'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Camera, Paperclip, Mic, X, History, FileText } from 'lucide-react';

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

export function SplitLayoutQueryInput() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('college');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  
  // Media attachments
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).substr(2, 9);
      const isImage = file.type.startsWith('image/');
      
      const newFile: AttachedFile = {
        id,
        file,
        type: isImage ? 'image' : 'document',
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setAttachedFiles((prev) => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFiles((prev) => [...prev, newFile]);
      }
    });

    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Could not access microphone');
      console.error('Audio recording error:', err);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
    audioChunksRef.current = [];
  };

  const handleHistory = () => {
    router.push('/library');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      const formData = new FormData();
      formData.append('query', query);
      formData.append('learningLevel', level);

      // Add attached files
      attachedFiles.forEach((attachedFile) => {
        formData.append(`files`, attachedFile.file);
      });

      // Add audio recording
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }

      const response = await fetch('/api/query/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit query');
      }

      // Show temporary result then redirect
      setResult('Research completed! Redirecting to results...');
      setTimeout(() => {
        router.push(`/results/${data.queryId}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
        {/* Left Side - Input and Results */}
        <div className="flex flex-col gap-4 bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label htmlFor="prompt" className="font-medium text-gray-700">
              Enter your prompt
            </label>
            
            <Textarea
              id="prompt"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your prompt here..."
              className="w-full h-32 resize-none"
              disabled={loading}
              required
            />

            {/* Media Attachments */}
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={loading}
              >
                <Camera className="h-4 w-4 mr-2" />
                
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {!audioBlob && (
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopAudioRecording : startAudioRecording}
                  disabled={loading}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {isRecording ? 'Stop' : 'Record'}
                </Button>
              )}

              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={loading}
                className="ml-auto px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white"
              >
                <option value="elementary">Elementary</option>
                <option value="high-school">High School</option>
                <option value="college">College</option>
                <option value="adult">Professional</option>
              </select>
            </div>

            {/* Display Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative inline-flex items-center gap-2 bg-gray-100 rounded px-2 py-1 text-sm"
                  >
                    {file.type === 'image' && file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <span className="max-w-[100px] truncate">{file.file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Display Audio Recording */}
            {audioBlob && (
              <div className="flex items-center gap-2 bg-gray-100 rounded px-3 py-2 text-sm">
                <Mic className="h-4 w-4 text-primary" />
                <span>Audio Recording ({(audioBlob.size / 1024).toFixed(1)} KB)</span>
                <button
                  type="button"
                  onClick={removeAudio}
                  className="ml-auto text-gray-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleHistory}
                disabled={loading}
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Researching...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </form>

          {/* Result Section */}
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <h3 className="font-medium text-gray-700">Result</h3>
            <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-auto">
              {error ? (
                <p className="text-red-600">{error}</p>
              ) : result ? (
                <p className="text-gray-800">{result}</p>
              ) : (
                <p className="text-gray-400 italic">Your result will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Audio and Video Players */}
        <div className="flex flex-col gap-6">
          {/* Audio Playback Section */}
          <div className="bg-white rounded-lg shadow-md p-6 flex-1 min-h-0">
            <h3 className="font-medium text-gray-700 mb-4">Audio Playback</h3>
            <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
              <audio
                controls
                className="w-full"
              >
                Your browser does not support the audio element.
              </audio>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Audio narration will appear here after submitting your query
              </p>
            </div>
          </div>

          {/* Video Player Section */}
          <div className="bg-white rounded-lg shadow-md p-6 flex-1 min-h-0">
            <h3 className="font-medium text-gray-700 mb-4">Video Player</h3>
            <div className="flex items-center justify-center h-[calc(100%-2rem)] bg-black rounded-lg">
              <video
                controls
                className="w-full h-full rounded-lg"
              >
                Your browser does not support the video element.
              </video>
              <div className="absolute text-white text-sm">
                Video explanation will appear here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
