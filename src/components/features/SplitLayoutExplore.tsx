'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Camera, 
  Paperclip, 
  Mic, 
  X, 
  History, 
  FileText,
  Play,
  Pause,
  Volume2,
  File as FileIcon,
  Image as ImageIcon,
  Clock,
  BookOpen,
  Headphones,
  Presentation,
  Layers,
  Brain,
  BarChart3,
  Network,
  Sparkles,
  Zap,
  Target,
  Award,
  TrendingUp,
  Trash2
} from 'lucide-react';

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

interface HistoryItem {
  id: string;
  queryText: string;
  createdAt: Date;
  topicDetected?: string;
}

export function SplitLayoutExplore() {
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
  
  // Camera modal
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // History sidebar
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load history when sidebar opens
  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory]);

  // Load conversation history
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/query/history');
      if (response.ok) {
        const data = await response.json();
        console.log('📜 History loaded:', data.queries?.length || 0, 'items');
        setHistoryItems(data.queries || []);
      }
    } catch (err) {
      console.error('❌ History error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistoryItemClick = (queryId: string) => {
    console.log('📖 Opening history item:', queryId);
    router.push(`/results/${queryId}`);
  };

  const handleDeleteHistoryItem = async (queryId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the item
    
    if (!confirm('Delete this item from history?')) return;
    
    setDeletingIds(prev => new Set(prev).add(queryId));
    
    try {
      console.log('🗑️ Deleting history item:', queryId);
      
      const response = await fetch(`/api/query/${queryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      console.log('✅ History item deleted');
      
      // Remove from local state
      setHistoryItems(prev => prev.filter(item => item.id !== queryId));
    } catch (err) {
      console.error('❌ Delete error:', err);
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(queryId);
        return next;
      });
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).substr(2, 9);
      const type = file.type.startsWith('image/') ? 'image' : 'document';
      
      const newFile: AttachedFile = { id, file, type };
      
      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setAttachedFiles(prev => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFiles(prev => [...prev, newFile]);
      }
    });
  };

  const handleCameraClick = () => {
    setShowCameraModal(true);
  };

  const handleTakePhoto = () => {
    setShowCameraModal(false);
    cameraInputRef.current?.click();
  };

  const handleChooseFromGallery = () => {
    setShowCameraModal(false);
    galleryInputRef.current?.click();
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current) return;
    
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setIsPlayingAudio(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/query/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, learningLevel: level }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit query');
      }

      router.push(`/results/${data.queryId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const capabilities = [
    { icon: Zap, text: "Instant AI Research", color: "text-yellow-500" },
    { icon: Target, text: "4 Learning Levels", color: "text-blue-500" },
    { icon: Award, text: "7 Content Formats", color: "text-purple-500" },
    { icon: Clock, text: "Learn Anywhere", color: "text-green-500" },
    { icon: TrendingUp, text: "Track Progress", color: "text-red-500" },
  ];

  const exampleTopics = [
    "How does quantum computing work?",
    "Explain machine learning basics",
    "History of Ancient Rome",
    "How photosynthesis works",
    "Blockchain technology explained",
    "Spanish grammar for beginners",
  ];

  const features = [
    { icon: BookOpen, title: "Articles", color: "from-blue-500 to-cyan-500" },
    { icon: Headphones, title: "Audio", color: "from-purple-500 to-pink-500" },
    { icon: Presentation, title: "Slides", color: "from-orange-500 to-red-500" },
    { icon: Layers, title: "Flashcards", color: "from-green-500 to-emerald-500" },
    { icon: Brain, title: "Quiz", color: "from-indigo-500 to-purple-500" },
    { icon: BarChart3, title: "Diagrams", color: "from-yellow-500 to-orange-500" },
    { icon: Network, title: "Map", color: "from-teal-500 to-cyan-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4 animate-pulse">
            <Sparkles className="h-4 w-4" />
            AI-Powered Learning Platform
          </div>
          
          <h1 className="text-4xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Learn Anything, Instantly
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ask any question and get comprehensive learning materials in 7 formats
          </p>
        </div>

        {/* Main Split Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* LEFT: Query Input (60%) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Query Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    What would you like to learn? 🎯
                  </label>
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Explain quantum computing, How does photosynthesis work, Spanish grammar basics..."
                    className="min-h-32 text-base resize-none"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Learning Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Learning Level 📚
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="elementary">Elementary School</option>
                    <option value="high-school">High School</option>
                    <option value="college">College / University</option>
                    <option value="adult">Professional</option>
                  </select>
                </div>

                {/* Media Attachments Preview */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        {file.type === 'image' && file.preview ? (
                          <img src={file.preview} alt="" className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200" />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                            <FileIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audio Preview */}
                {audioURL && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <audio ref={audioPlayerRef} src={audioURL} onEnded={() => setIsPlayingAudio(false)} />
                    <Button type="button" size="sm" variant="ghost" onClick={toggleAudioPlayback}>
                      {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Volume2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-900 flex-1">Voice recording attached</span>
                    <Button type="button" size="sm" variant="ghost" onClick={removeAudio}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  {/* Media Buttons */}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCameraClick} disabled={loading}>
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={loading}
                      className={isRecording ? 'bg-red-50 border-red-300 text-red-600' : ''}
                    >
                      <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowHistory(true)} disabled={loading}>
                      <History className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={loading} size="lg" className="px-8">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      'Explore Topic'
                    )}
                  </Button>
                </div>
              </form>

              {/* Hidden Inputs */}
              <input ref={fileInputRef} type="file" multiple hidden accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileSelect} />
              <input ref={cameraInputRef} type="file" hidden accept="image/*" capture="environment" onChange={handleFileSelect} />
              <input ref={galleryInputRef} type="file" hidden accept="image/*" onChange={handleFileSelect} />
            </div>

            {/* Example Topics */}
            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-gray-700 mb-3">Try these popular topics:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {exampleTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(topic)}
                    className="px-3 py-1.5 bg-white text-gray-700 rounded-full text-xs hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-200 hover:border-blue-300"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Features Showcase (40%) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Capabilities */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What You'll Get</h3>
              <div className="space-y-3">
                {capabilities.map((cap, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <cap.icon className={`h-5 w-5 ${cap.color}`} />
                    <span className="text-sm font-medium text-gray-700">{cap.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7 Formats */}
            {/* 7 Formats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">7 Learning Formats</h3>
              <div className="grid grid-cols-3 gap-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center p-2 rounded-xl bg-gray-50 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 transition-all group">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            {/* <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-2">⚡ Fast Generation</h3>
              <p className="text-sm opacity-90 mb-3">Complete learning package ready in ~2 minutes</p>
              <div className="flex items-center gap-2 text-xs opacity-75">
                <Clock className="h-4 w-4" />
                <span>Auto-saved to your history</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Photo</h3>
            <div className="space-y-3">
              <Button onClick={handleTakePhoto} className="w-full justify-start gap-3" size="lg">
                <Camera className="h-5 w-5" />
                Take Photo
              </Button>
              <Button onClick={handleChooseFromGallery} variant="outline" className="w-full justify-start gap-3" size="lg">
                <ImageIcon className="h-5 w-5" />
                Choose from Gallery
              </Button>
              <Button onClick={() => setShowCameraModal(false)} variant="ghost" className="w-full" size="lg">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Sidebar with Delete */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900">History</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No history yet</p>
                  <p className="text-sm text-gray-400 mt-1">Your queries will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      className="relative group"
                    >
                      <button
                        onClick={() => handleHistoryItemClick(item.id)}
                        disabled={deletingIds.has(item.id)}
                        className="w-full text-left p-3 pr-12 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600">
                          {item.topicDetected || item.queryText}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(item.createdAt)}
                        </div>
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        disabled={deletingIds.has(item.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Delete from history"
                      >
                        {deletingIds.has(item.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
