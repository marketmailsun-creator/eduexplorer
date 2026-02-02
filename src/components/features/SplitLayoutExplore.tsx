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

export function SplitLayoutExplore() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('college');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  
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

      attachedFiles.forEach((attachedFile) => {
        formData.append(`files`, attachedFile.file);
      });

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
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* SPLIT SCREEN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-8rem)]">
            
            {/* LEFT COLUMN - Input and Results */}
            <div className="flex flex-col gap-3 bg-white rounded-2xl shadow-md p-6 h-full min-h-0 overflow-hidden">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-shrink-0">
                <label htmlFor="prompt" className="font-medium text-gray-700 text-sm">
                  Enter your prompt
                </label>
                
                <Textarea
                  id="prompt"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type your prompt here..."
                  className="w-full h-32 resize-none rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                  required
                />

                {/* Controls Row */}
                <div className="flex items-center justify-between gap-3">
                  {/* LEFT: Media Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={loading}
                      className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-3"
                    >
                      <Camera className="h-4 w-4 mr-1.5" />
                      
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
                      className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-3"
                    >
                      <Paperclip className="h-4 w-4 mr-1.5" />
                      
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
                        className={`rounded-lg h-9 px-3 ${!isRecording ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : ''}`}
                      >
                        <Mic className="h-4 w-4 mr-1.5" />
                        {isRecording ? 'Stop' : 'Record'}
                      </Button>
                    )}

                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      disabled={loading}
                      className="px-3 h-9 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="elementary">Elementary</option>
                      <option value="high-school">High School</option>
                      <option value="college">College</option>
                      <option value="adult">Professional</option>
                    </select>
                  </div>

                  {/* RIGHT: Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleHistory}
                      disabled={loading}
                      className="bg-gray-600 text-white hover:bg-gray-700 rounded-lg h-9 px-4"
                    >
                      History
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg h-9 px-6"
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
                </div>

                {/* Attached Files */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="relative inline-flex items-center gap-2 bg-gray-100 rounded-lg px-2.5 py-1.5 text-sm"
                      >
                        {file.type === 'image' && file.preview ? (
                          <img
                            src={file.preview}
                            alt={file.file.name}
                            className="w-7 h-7 object-cover rounded"
                          />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="max-w-[100px] truncate text-gray-700">{file.file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-gray-500 hover:text-red-600 ml-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audio Recording */}
                {audioBlob && (
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm">
                    <Mic className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">Audio Recording ({(audioBlob.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={removeAudio}
                      className="ml-auto text-gray-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </form>

              {/* Result Section */}
              <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden mt-2">
                <h3 className="font-medium text-gray-700 text-sm flex-shrink-0">Result</h3>
                <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-auto">
                  {error ? (
                    <p className="text-red-600 text-sm">{error}</p>
                  ) : result ? (
                    <p className="text-gray-800 text-sm">{result}</p>
                  ) : (
                    <p className="text-gray-400 italic text-sm">Your result will appear here...</p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Audio and Video Players */}
            <div className="flex flex-col gap-6 h-full">
              
              {/* Audio Playback - 30% height */}
              <div className="bg-white rounded-xl shadow-sm p-6" style={{ height: '30%', minHeight: '200px' }}>
                <h3 className="font-medium text-gray-700 mb-4 text-sm">Audio Playback</h3>
                <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
                  <audio controls className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Audio narration will appear here after submitting your query
                  </p>
                </div>
              </div>

              {/* Video Player - 70% height (rest of page) */}
              {/* <div className="bg-white rounded-xl shadow-sm p-6 flex-1" style={{ minHeight: '300px' }}>
                <h3 className="font-medium text-gray-700 mb-4 text-sm">Video Player</h3>
                <div className="relative w-full h-[calc(100%-2rem)] bg-black rounded-lg flex items-center justify-center overflow-hidden">
                  <video controls className="w-full h-full rounded-lg">
                    Your browser does not support the video element.
                  </video>
                  <div className="absolute text-white text-sm bg-black/50 px-4 py-2 rounded pointer-events-none">
                    Video explanation will appear here
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
