'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  FileText,
  Presentation,
  Layers,
  Brain,
  BarChart3,
  Network,
  Headphones,
  Volume2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Download,
  Loader2
} from 'lucide-react';
import { AudioPlayerSection } from './AudioPlayerSection';
import { PresentationViewer } from './PresentationViewer';
import { FlashcardViewer } from './FlashcardViewer';
import { PracticeQuizViewer } from './PracticeQuizViewer';
import { DiagramViewer } from './DiagramViewer';
import { GenerateFlashcardsButton } from './GenerateFlashcardsButton';
import { GeneratePresentationButton } from './GeneratePresentationButton';
import { GenerateDiagramsButton } from './GenerateDiagramsButton';
import { GenerateAudioButton } from './GenerateAudioButton';
import jsPDF from 'jspdf';
//import { InteractiveConceptMapClickable } from './InteractiveConceptMap';
import { EnhancedConceptMap } from './EnhancedConceptMap';
import { GenerateQuizButton } from './GenerateQuizButton';
import { GenerateConceptMapButton } from './GenerateConceptMapButton';

interface InteractiveResultsViewProps {
  query: any;
  cleanText: string;
  hasAudioContent: boolean;
  audioContent: any;
  hasPresentationData: boolean;
  presentationData: any;
  hasFlashcards: boolean;
  flashcardData: any;
  hasDiagrams: boolean;
  diagramData: any;
  hasQuiz: boolean;
  quiz: any;
  conceptMapData: any;
  articleText: string;
  queryId: string;
  /** When false, "Generate X" buttons are hidden (non-owner group/challenge access) */
  isOwner?: boolean;
  /** When set, quiz submits challenge score to /api/challenge/submit-score */
  challengeId?: string;
  /** When true, auto-triggers quiz and shows "Generate Explanation" CTA instead of article */
  autoQuizMode?: boolean;
}

type CardSize = 'normal' | 'minimized' | 'maximized';

// ── Article heading renderer ─────────────────────────────────────────────────
// Color palette for each of the 8 article sections
const SECTION_COLORS: Record<number, { border: string; bg: string; text: string }> = {
  1: { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-900' },
  2: { border: 'border-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-900' },
  3: { border: 'border-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-900'   },
  4: { border: 'border-teal-400',   bg: 'bg-teal-50',   text: 'text-teal-900'   },
  5: { border: 'border-green-400',  bg: 'bg-green-50',  text: 'text-green-900'  },
  6: { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-900' },
  7: { border: 'border-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-900'  },
  8: { border: 'border-rose-400',   bg: 'bg-rose-50',   text: 'text-rose-900'   },
};
const DEFAULT_SECTION_COLOR = { border: 'border-gray-300', bg: 'bg-gray-50', text: 'text-gray-800' };

function renderArticleWithHeadings(text: string) {
  const lines = text.split('\n');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [];
  let paragraphBuffer: string[] = [];
  let keyCounter = 0;

  const flushParagraph = () => {
    const content = paragraphBuffer.join('\n').trim();
    if (content) {
      elements.push(
        <p key={`p-${keyCounter++}`} className="text-gray-700 leading-relaxed text-sm mb-3">
          {content}
        </p>
      );
    }
    paragraphBuffer = [];
  };

  for (const line of lines) {
    // Match ## N. Title or ## Title
    const h2Match = line.match(/^##\s+(?:(\d+)\.?\s+)?(.+)$/);
    if (h2Match) {
      flushParagraph();
      const sectionNum = h2Match[1] ? parseInt(h2Match[1]) : 0;
      const headingText = h2Match[2].trim();
      const colors = SECTION_COLORS[sectionNum] ?? DEFAULT_SECTION_COLOR;
      elements.push(
        <div key={`h2-${keyCounter++}`} className={`mt-6 mb-2 pl-3 border-l-4 ${colors.border} ${colors.bg} rounded-r-lg py-1.5 pr-3`}>
          <h2 className={`text-base font-bold ${colors.text}`}>{headingText}</h2>
        </div>
      );
      continue;
    }

    // Match ### Title
    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      flushParagraph();
      elements.push(
        <h3 key={`h3-${keyCounter++}`} className="text-sm font-semibold text-gray-700 mt-4 mb-1">
          {h3Match[1].trim()}
        </h3>
      );
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return elements;
}

export function InteractiveResultsView({
  query,
  cleanText,
  hasAudioContent,
  audioContent,
  hasPresentationData,
  presentationData,
  hasFlashcards,
  flashcardData,
  hasDiagrams,
  diagramData,
  hasQuiz,
  quiz,
  conceptMapData,
  articleText,
  queryId,
  isOwner = true,
  challengeId,
  autoQuizMode = false,
}: InteractiveResultsViewProps) {
  
  const router = useRouter();
  const autoQuizStarted = useRef(false);
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [articleGenerateError, setArticleGenerateError] = useState('');

  // Auto-trigger quiz generation when arriving via autoQuiz mode (no article generated yet)
  useEffect(() => {
    if (autoQuizMode && !hasQuiz && isOwner && !autoQuizStarted.current) {
      autoQuizStarted.current = true;
      fetch('/api/content/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, numQuestions: 10 }),
      }).then(res => {
        if (res.ok) router.refresh();
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateArticle = async () => {
    setGeneratingArticle(true);
    setArticleGenerateError('');
    try {
      const res = await fetch('/api/content/article/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setArticleGenerateError(data.error || 'Failed to generate explanation');
        return;
      }
      router.refresh();
    } catch {
      setArticleGenerateError('Failed to generate explanation');
    } finally {
      setGeneratingArticle(false);
    }
  };

  // Card size states
  const [explanationSize, setExplanationSize] = useState<CardSize>('normal');
  const [audioSize, setAudioSize] = useState<CardSize>('normal');
  const [diagramsSize, setDiagramsSize] = useState<CardSize>('normal');
  const [conceptMapSize, setConceptMapSize] = useState<CardSize>('normal');
  const [presentationSize, setPresentationSize] = useState<CardSize>('normal');
  const [flashcardsSize, setFlashcardsSize] = useState<CardSize>('normal');
  const [quizSize, setQuizSize] = useState<CardSize>('normal');
  //const quizSets = query.content.filter(c => c.contentType === 'quiz');
  const quizSets = query.content.filter(
      (c: { contentType: string }) => c.contentType === "quiz"
    );
  const latestQuiz = quizSets[quizSets.length - 1]; // use the most recent

  // Flashcard sets tracking (parity with quizSets)
  const flashcardSets = query.content.filter(
    (c: { contentType: string }) => c.contentType === 'flashcards'
  );
  const latestFlashcard = flashcardSets[flashcardSets.length - 1];
  const currentFlashcardData = (latestFlashcard?.data as any) ?? flashcardData;
  const currentDeck = currentFlashcardData?.deck ?? flashcardData?.deck;
  const currentDeckId = latestFlashcard?.id ?? flashcardData?.deckId;
  const flashcardSetNumber = (latestFlashcard as any)?.setNumber ?? 1;

  // Download PDF function
  const handleDownloadPDF = () => {
    try {
      console.log('🔥 Generating PDF...');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let y = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(query.queryText, margin, y);
      y += 10;

      // Metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Learning Level: ${query.complexityLevel || 'College'}`, margin, y);
      y += 5;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
      y += 15;

      // Content
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');
      
      const text = cleanText || 'Content not available';
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 7;
      });

      // Save PDF
      const filename = `${query.queryText.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      doc.save(filename);
      
      console.log('✅ PDF downloaded:', filename);
    } catch (error) {
      console.error('❌ PDF download error:', error);
      alert('Failed to download PDF');
    }
  };

  // Download Audio function
  const handleDownloadAudio = async () => {
    try {
      if (!audioContent?.storageUrl) {
        alert('Audio not available');
        return;
      }

      console.log('🔥 Downloading audio...');

      const response = await fetch(audioContent.storageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${query.queryText.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Audio downloaded');
    } catch (error) {
      console.error('❌ Audio download error:', error);
      alert('Failed to download audio');
    }
  };

  // Size toggle helpers
  const toggleSize = (currentSize: CardSize, setter: (size: CardSize) => void) => {
    if (currentSize === 'normal') setter('maximized');
    else if (currentSize === 'maximized') setter('normal');
  };

  const toggleMinimize = (currentSize: CardSize, setter: (size: CardSize) => void) => {
    if (currentSize === 'minimized') setter('normal');
    else setter('minimized');
  };

  // Get card height class
  const getCardClass = (size: CardSize, defaultClass: string = '') => {
    if (size === 'minimized') return '';
    if (size === 'maximized') return 'lg:col-span-2 h-[80vh]';
    return defaultClass;
  };

  return (
     <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 md:gap-6">
      
      {/* LEFT COLUMN (Desktop) / TOP SECTION (Mobile) - Article Content */}
      <div className={`flex flex-col gap-6 ${presentationSize === 'maximized' || flashcardsSize === 'maximized' || quizSize === 'maximized' ? 'lg:col-span-2' : ''}`}>
      {/* LEFT COLUMN */}
         <Card className="w-full overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <CardHeader className="pb-3 px-4 bg-blue-50/60">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Comprehensive Explanation
              </CardTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDownloadPDF}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title="Download as PDF"
                  type="button"
                >
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => toggleMinimize(explanationSize, setExplanationSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={explanationSize === 'minimized' ? 'Restore' : 'Minimize'}
                  type="button"
                >
                  {explanationSize === 'minimized' ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {/* <button
                  onClick={() => toggleSize(explanationSize, setExplanationSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={explanationSize === 'maximized' ? 'Restore' : 'Maximize'}
                  type="button"
                >
                  {explanationSize === 'maximized' ? (
                    <Minimize2 className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-gray-600" />
                  )}
                </button> */}
              </div>
            </div>
          </CardHeader>
          {explanationSize !== 'minimized' && (
            <CardContent className={`overflow-auto ${explanationSize === 'maximized' ? 'h-[calc(80vh-4rem)]' : 'max-h-[400px]'}`}>
              {cleanText ? (
                <div className="prose prose-sm max-w-none">
                  {renderArticleWithHeadings(cleanText)}
                </div>
              ) : autoQuizMode ? (
                <div className="text-center py-10 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl space-y-3">
                  <FileText className="h-14 w-14 mx-auto text-blue-400" />
                  <p className="text-gray-600 text-sm">No explanation generated yet.</p>
                  {articleGenerateError && (
                    <p className="text-sm text-red-600">{articleGenerateError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleGenerateArticle}
                    disabled={generatingArticle}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {generatingArticle ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                    ) : (
                      <><FileText className="h-4 w-4" /> Generate Comprehensive Explanation</>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">Content is being generated...</p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Presentation */}
        <Card className="w-full overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
          <CardHeader className="pb-3 px-4 bg-orange-50/60">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Presentation className="h-5 w-5 text-red-600" />
                Presentation Slides
              </CardTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleMinimize(presentationSize, setPresentationSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={presentationSize === 'minimized' ? 'Restore' : 'Minimize'}
                  type="button"
                >
                  {presentationSize === 'minimized' ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {/* <button
                  onClick={() => toggleSize(presentationSize, setPresentationSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={presentationSize === 'maximized' ? 'Restore' : 'Maximize'}
                  type="button"
                >
                  {presentationSize === 'maximized' ? (
                    <Minimize2 className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-gray-600" />
                  )}
                </button> */}
              </div>
            </div>
          </CardHeader>
          {presentationSize !== 'minimized' && (
            <CardContent>
              {hasPresentationData ? (
                <PresentationViewer
                  presentationData={presentationData.presentation}
                  autoPlay={false}
                  queryId={queryId}
                />
              ) : (
                <div className="text-center py-10 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-xl">
                  <Presentation className="h-14 w-14 mx-auto mb-4 text-orange-400" />
                  <p className="text-gray-600 mb-6">Generate presentation slides</p>
                  {isOwner ? (
                    <GeneratePresentationButton queryId={queryId} />
                  ) : (
                    <p className="text-xs text-gray-400 italic">Only the content owner can generate materials</p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Visual Diagrams */}
        <Card className="w-full overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <CardHeader className="pb-3 px-4 bg-emerald-50/60">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Visual Diagrams
              </CardTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleMinimize(diagramsSize, setDiagramsSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={diagramsSize === 'minimized' ? 'Restore' : 'Minimize'}
                  type="button"
                >
                  {diagramsSize === 'minimized' ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {/* <button
                  onClick={() => toggleSize(diagramsSize, setDiagramsSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={diagramsSize === 'maximized' ? 'Restore' : 'Maximize'}
                  type="button"
                >
                  {diagramsSize === 'maximized' ? (
                    <Minimize2 className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-gray-600" />
                  )}
                </button> */}
              </div>
            </div>
          </CardHeader>
          {diagramsSize !== 'minimized' && (
            <CardContent>
              {hasDiagrams ? (
                <DiagramViewer diagrams={diagramData.diagrams} />
              ) : (
                <div className="text-center py-10 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
                  <BarChart3 className="h-14 w-14 mx-auto mb-4 text-emerald-400" />
                  <p className="text-gray-600 mb-6">Generate visual diagrams</p>
                  {isOwner ? (
                    <GenerateDiagramsButton queryId={queryId} />
                  ) : (
                    <p className="text-xs text-gray-400 italic">Only the content owner can generate materials</p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Concept Map */}
        {conceptMapData && (
           <Card className="w-full overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardHeader className="pb-3 px-4 bg-amber-50/60">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Network className="h-5 w-5 text-orange-600" />
                  Interactive Concept Map
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMinimize(conceptMapSize, setConceptMapSize)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title={conceptMapSize === 'minimized' ? 'Restore' : 'Minimize'}
                    type="button"
                  >
                    {conceptMapSize === 'minimized' ? (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                  {/* <button
                    onClick={() => toggleSize(conceptMapSize, setConceptMapSize)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title={conceptMapSize === 'maximized' ? 'Restore' : 'Maximize'}
                    type="button"
                  >
                    {conceptMapSize === 'maximized' ? (
                      <Minimize2 className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-gray-600" />
                    )}
                  </button> */}
                </div>
              </div>
            </CardHeader>
            {conceptMapSize !== 'minimized' && (
             <CardContent>
                {conceptMapData ? (
                  <EnhancedConceptMap
                    data={conceptMapData}
                    articleText={articleText}
                  />
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Network className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-6">Generate an interactive concept map</p>
                    {isOwner ? (
                      <GenerateConceptMapButton queryId={queryId} />
                    ) : (
                      <p className="text-xs text-gray-400 italic">Only the content owner can generate materials</p>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}
      </div> 

      {/* RIGHT COLUMN */}
      <div className={`flex flex-col gap-6 ${presentationSize === 'maximized' || flashcardsSize === 'maximized' || quizSize === 'maximized' ? 'lg:col-span-2' : ''}`}>
        {/* Audio Player */}
        <Card className="w-full overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-purple-500 to-violet-600" />
          <CardHeader className="pb-3 px-4 bg-purple-50/60">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Headphones className="h-5 w-5 text-purple-600" />
                Audio Playback
              </CardTitle>
              <div className="flex items-center gap-1">
                {hasAudioContent && (
                  <button
                    onClick={handleDownloadAudio}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="Download MP3"
                    type="button"
                  >
                    <Download className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                <button
                  onClick={() => toggleMinimize(audioSize, setAudioSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={audioSize === 'minimized' ? 'Restore' : 'Minimize'}
                  type="button"
                >
                  {audioSize === 'minimized' ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {/* <button
                  onClick={() => toggleSize(audioSize, setAudioSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={audioSize === 'maximized' ? 'Restore' : 'Maximize'}
                  type="button"
                >
                  {audioSize === 'maximized' ? (
                    <Minimize2 className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-gray-600" />
                  )}
                </button> */}
              </div>
            </div>
          </CardHeader>
          {audioSize !== 'minimized' && (
            <CardContent>
              {hasAudioContent ? (
                <AudioPlayerSection audioContent={audioContent} queryId={queryId} />
              ) : (
                <div className="text-center py-8 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-xl">
                  <Volume2 className="h-12 w-12 mx-auto mb-3 text-purple-400" />
                  <p className="text-gray-600 mb-4 text-sm">Audio narration not available</p>
                  {isOwner ? (
                    <GenerateAudioButton queryId={queryId} />
                  ) : (
                    <p className="text-xs text-gray-400 italic">Only the content owner can generate materials</p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Quiz <Card className={`${getCardClass(quizSize)} transition-all`}>*/}
        <Card id="quiz-section" className="w-full overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-600" />
          <CardHeader className="pb-3 px-4 bg-pink-50/60">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-pink-600" />
                Practice Quiz
                {quizSets.length > 1 && (
                  <span className="text-xs font-normal text-pink-500 ml-1">
                    Set {(latestQuiz?.data as any)?.setNumber ?? quizSets.length}
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleMinimize(quizSize, setQuizSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={quizSize === 'minimized' ? 'Restore' : 'Minimize'}
                  type="button"
                >
                  {quizSize === 'minimized' ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {/* <button
                  onClick={() => toggleSize(quizSize, setQuizSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={quizSize === 'maximized' ? 'Restore' : 'Maximize'}
                  type="button"
                >
                  {quizSize === 'maximized' ? (
                    <Minimize2 className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-gray-600" />
                  )}
                </button> */}
              </div>
            </div>
          </CardHeader>
          {quizSize !== 'minimized' && (
            <CardContent>
              {(() => {
                // Always use the latest quiz set's data, not the prop from the server
                // (the prop may be from the first quiz set due to find() ordering)
                const activeQuiz = (latestQuiz?.data as any)?.quiz ?? quiz;
                return activeQuiz ? (
                  <PracticeQuizViewer
                    quiz={activeQuiz}
                    queryId={query.id}
                    totalSets={quizSets.length}
                    isOwner={isOwner}
                    challengeId={challengeId}
                  />
                ) : (
                <div className="text-center py-10 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-xl">
                  <Brain className="h-14 w-14 mx-auto mb-4 text-pink-400" />
                  <p className="text-gray-600 mb-6">Test your knowledge with a practice quiz</p>
                  {isOwner ? (
                    <GenerateQuizButton queryId={queryId} />
                  ) : (
                    <p className="text-xs text-gray-400 italic">Only the content owner can generate materials</p>
                  )}
                </div>
                );
              })()}
            </CardContent>
          )}
        </Card>

        {/* Flashcards className={`${getCardClass(flashcardsSize)} transition-all`}*/}
        <Card className='w-full overflow-hidden'>
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-blue-600" />
          <CardHeader className="pb-3 px-4 bg-indigo-50/60">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-5 w-5 text-indigo-600" />
                Flashcards {flashcardSets.length > 1 && <span className="text-xs font-normal text-indigo-500 ml-1">Set {flashcardSetNumber}</span>}
              </CardTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleMinimize(flashcardsSize, setFlashcardsSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={flashcardsSize === 'minimized' ? 'Restore' : 'Minimize'}
                  type="button"
                >
                  {flashcardsSize === 'minimized' ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  )}
                </button>
                {/* <button
                  onClick={() => toggleSize(flashcardsSize, setFlashcardsSize)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title={flashcardsSize === 'maximized' ? 'Restore' : 'Maximize'}
                  type="button"
                >
                  {flashcardsSize === 'maximized' ? (
                    <Minimize2 className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-gray-600" />
                  )}
                </button> */}
              </div>
            </div>
          </CardHeader>
          {flashcardsSize !== 'minimized' && (
            <CardContent>
              {hasFlashcards && currentDeck ? (
                <FlashcardViewer
                  deck={currentDeck}
                  deckId={currentDeckId}
                  isOwner={isOwner}
                  queryId={queryId}
                  setNumber={flashcardSetNumber}
                  totalSets={flashcardSets.length}
                />
              ) : (
                <div className="text-center py-10 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
                  <Layers className="h-14 w-14 mx-auto mb-4 text-indigo-400" />
                  <p className="text-gray-600 mb-6">Generate flashcards</p>
                  {isOwner ? (
                    <GenerateFlashcardsButton queryId={queryId} />
                  ) : (
                    <p className="text-xs text-gray-400 italic">Only the content owner can generate materials</p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        
      </div>
    </div>
    </div>
  );
}
