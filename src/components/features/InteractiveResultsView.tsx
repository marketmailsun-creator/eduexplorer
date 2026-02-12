'use client';

import { useState } from 'react';
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
  Download
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
}

type CardSize = 'normal' | 'minimized' | 'maximized';

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
}: InteractiveResultsViewProps) {
  
  // Card size states
  const [explanationSize, setExplanationSize] = useState<CardSize>('normal');
  const [audioSize, setAudioSize] = useState<CardSize>('normal');
  const [diagramsSize, setDiagramsSize] = useState<CardSize>('normal');
  const [conceptMapSize, setConceptMapSize] = useState<CardSize>('normal');
  const [presentationSize, setPresentationSize] = useState<CardSize>('normal');
  const [flashcardsSize, setFlashcardsSize] = useState<CardSize>('normal');
  const [quizSize, setQuizSize] = useState<CardSize>('normal');

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
         <Card className="w-full">
          <CardHeader className="pb-3 px-4">
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
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {cleanText}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">Content is being generated...</p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Presentation */}
        <Card className="w-full">
          <CardHeader className="pb-3 px-4">
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
                />
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                  <Presentation className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-6">Generate presentation slides</p>
                  <GeneratePresentationButton queryId={queryId} />
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Visual Diagrams */}
        <Card className="w-full">
          <CardHeader className="pb-3 px-4">
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
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-6">Generate visual diagrams</p>
                  <GenerateDiagramsButton queryId={queryId} />
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Concept Map */}
        {conceptMapData && (
           <Card className="w-full">          
            <CardHeader className="pb-3 px-4">
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
                    <GenerateConceptMapButton queryId={queryId} />
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
        <Card className="w-full">
          <CardHeader className="pb-3 px-4">
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
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                  <Volume2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-4 text-sm">Audio narration not available</p>
                  <GenerateAudioButton queryId={queryId} />
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Quiz <Card className={`${getCardClass(quizSize)} transition-all`}>*/}
        <Card id="quiz-section" className="w-full">
          <CardHeader className="pb-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-pink-600" />
                Practice Quiz
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
              {hasQuiz && quiz ? (
                <PracticeQuizViewer quiz={quiz} queryId={query.id} />
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-6">Test your knowledge with a practice quiz</p>
                  <GenerateQuizButton queryId={queryId} />
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Flashcards className={`${getCardClass(flashcardsSize)} transition-all`}*/}
        <Card className='w-full'>
          <CardHeader className="pb-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-5 w-5 text-indigo-600" />
                Flashcards
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
              {hasFlashcards ? (
                <FlashcardViewer deck={flashcardData.deck} deckId={flashcardData.deckId} />
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                  <Layers className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-6">Generate flashcards</p>
                  <GenerateFlashcardsButton queryId={queryId} />
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
