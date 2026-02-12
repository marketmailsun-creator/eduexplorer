'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingProgressScreen } from '@/components/features/LoadingProgressScreen';
import { useSearchParams } from 'next/navigation';
import { OnboardingFlow } from '@/components/features/OnboardingFlow';
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

interface SplitLayoutExploreProps {
    onboardingDone?: boolean;
    userName?: string;
  }

 export function SplitLayoutExplore({ onboardingDone = true, userName = '' }: SplitLayoutExploreProps={}) {

  const router = useRouter();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('college');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(!onboardingDone);
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

  const [loadingQuery, setLoadingQuery] = useState('');
  const [hasMediaLoading, setHasMediaLoading] = useState(false);
  
  // Load history when sidebar opens
  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory]);

  const searchParams = useSearchParams();
   useEffect(() => {
     const q = searchParams.get('q');
     if (q) setQuery(decodeURIComponent(q));
   }, [searchParams]);
   
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
    e.stopPropagation();
    
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
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // ✅ Start live speech recognition WHILE recording
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;       // Keep listening until stopped
        recognition.interimResults = false;  // Only final results

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join(' ')
            .trim();
          if (transcript) {
            setQuery(transcript);
            console.log('🎤 Live transcribed:', transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('⚠️ Speech recognition error:', event.error);
        };

        // Store recognition instance so we can stop it when recording stops
        (mediaRecorderRef.current as any)._recognition = recognition;
        recognition.start();
        console.log('🎤 Live speech recognition started');
      } else {
        console.warn('⚠️ SpeechRecognition not supported in this browser');
      }

    } catch (err) {
      console.error('Microphone error:', err);
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // ✅ Stop speech recognition first
      const recognition = (mediaRecorderRef.current as any)._recognition;
      if (recognition) {
        recognition.stop();
        console.log('🎤 Speech recognition stopped');
      }
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
    const hasMedia = attachedFiles.length > 0 || !!audioBlob;
    if (!query.trim() && !hasMedia) {
      setError('Please enter a question, or attach an image/file.');
      return;
    }
    setLoading(true);
    setLoadingQuery(query || 'your attached content');
    setHasMediaLoading(hasMedia);
    setError('');
    console.log('📤 Submitting query...');
    console.log('  - Query:', query);
    console.log('  - Level:', level);
    console.log('  - Files:', attachedFiles.length);
    console.log('  - Audio:', audioBlob ? 'Yes' : 'No');

    try {
      // ✅ Use FormData so files and audio are included
      const formData = new FormData();
      formData.append('query', query);
      formData.append('learningLevel', level);

      // Attach image/document files
      attachedFiles.forEach((attachedFile) => {
        formData.append('files', attachedFile.file);
        console.log('  📎 Adding file:', attachedFile.file.name);
      });

      // Attach audio recording
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
        console.log('  🎤 Adding audio recording');
      }

      const response = await fetch('/api/query/submit', {
        method: 'POST',
        body: formData, // ✅ No Content-Type header — browser sets it with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit query');
      }

      console.log('✅ Query submitted successfully:', data.queryId);
      router.push(`/results/${data.queryId}`);
    } catch (err) {
      console.error('❌ Submit error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
      setLoadingQuery('');
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
    // { icon: Network, title: "Map", color: "from-teal-500 to-cyan-500" },
  ];
  if (loading && loadingQuery) {
      return <LoadingProgressScreen query={loadingQuery} hasMedia={hasMediaLoading} />;
  }
  if (showOnboarding) {
      return (
        <OnboardingFlow
          userName={userName}
          onComplete={() => setShowOnboarding(false)}
        />
      );
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pb-16 md:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        
        {/* Hero Section - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-8 space-y-2 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium mb-2 sm:mb-4 animate-pulse">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">AI-Powered Learning Platform</span>
            <span className="xs:hidden">AI Learning</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent px-4">
            Learn Anything, Instantly
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Ask any question and get comprehensive learning materials
          </p>
        </div>

        {/* Main Layout - Stack on Mobile, Side-by-Side on Desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* LEFT: Query Input */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                
                {/* Query Input - Mobile Optimized */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <span className="hidden sm:inline">What would you like to learn? 🎯</span>
                    <span className="sm:hidden">Your Question 🎯</span>
                  </label>
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type your question, or attach an image/file and submit directly..."
                    className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
                    disabled={loading}
                    
                  />
                </div>

                {/* Learning Level - Mobile Optimized */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Learning Level 📚
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="elementary">Elementary School</option>
                    <option value="high-school">High School</option>
                    <option value="college">College / University</option>
                    <option value="adult">Professional</option>
                  </select>
                </div>

                {/* Media Attachments Preview - Mobile Optimized */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        {file.type === 'image' && file.preview ? (
                          <img src={file.preview} alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-gray-200" />
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                            <FileIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audio Preview - Mobile Optimized */}
                {audioURL && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <audio ref={audioPlayerRef} src={audioURL} onEnded={() => setIsPlayingAudio(false)} />
                    <Button type="button" size="sm" variant="ghost" onClick={toggleAudioPlayback} className="h-8 w-8 p-0">
                      {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Volume2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-blue-900 flex-1 truncate">Voice recording</span>
                    <Button type="button" size="sm" variant="ghost" onClick={removeAudio} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                    {error}
                  </div>
                )}

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  {/* Media Buttons - Full Width on Mobile */}
                  <div className="flex gap-2 justify-between sm:justify-start">
                    <Button type="button" variant="outline" size="sm" onClick={handleCameraClick} disabled={loading} className="flex-1 sm:flex-none h-10">
                      <Camera className="h-4 w-4" />
                      {/* <span className="ml-2 sm:hidden">Photo</span> */}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading} className="flex-1 sm:flex-none h-10">
                      <Paperclip className="h-4 w-4" />
                      {/* <span className="ml-2 sm:hidden">File</span> */}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={loading}
                      className={`flex-1 sm:flex-none h-10 ${isRecording ? 'bg-red-50 border-red-300 text-red-600' : ''}`}
                    >
                      <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                      {/* <span className="ml-2 sm:hidden">{isRecording ? 'Stop' : 'Voice'}</span> */}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowHistory(true)} disabled={loading} className="flex-1 sm:flex-none h-10">
                      <History className="h-4 w-4" />
                      {/* <span className="ml-2 sm:hidden">History</span> */}
                    </Button>
                  </div>

                  {/* Submit Button - Full Width on Mobile */}
                  <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto px-6 sm:px-8 h-12">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Researching...</span>
                        <span className="sm:hidden">Loading...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Explore Topic</span>
                        <span className="sm:hidden">Start Learning</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Hidden Inputs */}
              <input ref={fileInputRef} type="file" multiple hidden accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileSelect} />
              <input ref={cameraInputRef} type="file" hidden accept="image/*" capture="environment" onChange={handleFileSelect} />
              <input ref={galleryInputRef} type="file" hidden accept="image/*" onChange={handleFileSelect} />
            </div>

            {/* Example Topics - Mobile Optimized */}
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                <span className="hidden sm:inline">Try these popular topics:</span>
                <span className="sm:hidden">Try these:</span>
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {exampleTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(topic)}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-gray-700 rounded-full text-xs hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-200 hover:border-blue-300"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Features Showcase - Mobile Optimized */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            
            {/* Capabilities - Mobile Optimized */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">What You'll Get</h3>
              <div className="space-y-2 sm:space-y-3">
                {capabilities.map((cap, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-3">
                    <cap.icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${cap.color}`} />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{cap.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7 Formats - Mobile Optimized Grid */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">7 Learning Formats</h3>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 transition-all group">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal - Mobile Optimized */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Add Photo</h3>
            <div className="space-y-2 sm:space-y-3">
              <Button onClick={handleTakePhoto} className="w-full justify-start gap-3 h-12" size="lg">
                <Camera className="h-5 w-5" />
                Take Photo
              </Button>
              <Button onClick={handleChooseFromGallery} variant="outline" className="w-full justify-start gap-3 h-12" size="lg">
                <ImageIcon className="h-5 w-5" />
                Choose from Gallery
              </Button>
              <Button onClick={() => setShowCameraModal(false)} variant="ghost" className="w-full h-12" size="lg">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Sidebar - Mobile Full Screen */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full sm:max-w-md bg-white h-full shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between z-10">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">History</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="h-9 w-9 p-0">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-3 sm:p-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm sm:text-base">No history yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Your queries will appear here</p>
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
                        className="w-full text-left p-2.5 sm:p-3 pr-10 sm:pr-12 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600">
                          {item.topicDetected || item.queryText}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 sm:gap-2">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(item.createdAt)}
                        </div>
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        disabled={deletingIds.has(item.id)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
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
