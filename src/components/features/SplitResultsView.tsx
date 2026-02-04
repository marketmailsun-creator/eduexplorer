'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText, 
  ArrowLeft, 
  Download, 
  Share2,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AudioPlayerSection } from './AudioPlayerSection';
//import { VideoPlayer } from './VideoPlayer';
import jsPDF from 'jspdf';

interface SplitResultsViewProps {
  query: any;
  article: any;
  audio: any;
  video: any;
}

export function SplitResultsView({ query, article, audio, video }: SplitResultsViewProps) {
  const router = useRouter();
  const articleData = article?.data as any;
  const videoData = video?.data as any;

  // Minimize/Maximize states
  const [articleMinimized, setArticleMinimized] = useState(false);
  const [sourcesMinimized, setSourcesMinimized] = useState(false);
  const [audioMinimized, setAudioMinimized] = useState(false);
  const [videoMinimized, setVideoMinimized] = useState(false);
  const [summaryMinimized, setSummaryMinimized] = useState(false);

  // Download article as PDF
  const handleDownloadPDF = () => {
    try {
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
      
      const text = articleData?.text || 'Content not available';
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 7;
      });

      // Sources section
      if (query.researchData?.sources && query.researchData.sources.length > 0) {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = margin;
        }
        
        y += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Sources & References', margin, y);
        y += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        query.researchData.sources.forEach((source: any, idx: number) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}. ${source.title}`, margin, y);
          y += 5;
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100);
          doc.text(source.url, margin + 5, y);
          y += 10;
          doc.setTextColor(0);
        });
      }

      // Save PDF
      const filename = `${query.queryText.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      doc.save(filename);
      
      console.log('✅ PDF downloaded:', filename);
    } catch (error) {
      console.error('❌ PDF download error:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // Download audio as MP3
  const handleDownloadAudio = async () => {
    try {
      if (!audio?.storageUrl) {
        alert('Audio not available for download');
        return;
      }

      console.log('📥 Downloading audio:', audio.storageUrl);

      const response = await fetch(audio.storageUrl);
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
      alert('Failed to download audio. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/explore')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{query.queryText}</h1>
              <p className="text-sm text-gray-600">
                Level: {query.complexityLevel || 'College'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Side - Content and Sources */}
          <div className="flex flex-col gap-4 overflow-auto">
            {/* Main Article */}
            <Card className={`${articleMinimized ? '' : 'flex-1'} transition-all`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4 w-4" />
                    Comprehensive Explanation
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadPDF}
                      className="h-8 w-8 p-0"
                      title="Download as PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setArticleMinimized(!articleMinimized)}
                      className="h-8 w-8 p-0"
                      title={articleMinimized ? "Maximize" : "Minimize"}
                    >
                      {articleMinimized ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {!articleMinimized && (
                <CardContent className="overflow-auto max-h-[500px]">
                  <div className="prose prose-slate max-w-none">
                    {articleData?.text ? (
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                        {articleData.text}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic text-sm">
                        Content is being generated...
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Sources */}
            {query.researchData && (
              <Card className={`${sourcesMinimized ? '' : ''} transition-all`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      Sources & References
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSourcesMinimized(!sourcesMinimized)}
                      className="h-8 w-8 p-0"
                      title={sourcesMinimized ? "Maximize" : "Minimize"}
                    >
                      {sourcesMinimized ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {!sourcesMinimized && (
                  <CardContent className="max-h-[300px] overflow-auto">
                    <div className="space-y-3">
                      {(query.researchData.sources as any[])?.map((source, idx) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-3 py-1">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline text-sm"
                          >
                            {source.title}
                          </a>
                          <p className="text-xs text-gray-600 mt-1">
                            {source.snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Right Side - Audio and Video Players */}
          <div className="flex flex-col gap-6">
            {/* Audio Player */}
            {/* <Card className={`${audioMinimized ? '' : 'flex-1'} transition-all`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    Audio Playback
                  </CardTitle>
                  <div className="flex gap-1">
                    {audio && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadAudio}
                        className="h-8 w-8 p-0"
                        title="Download MP3"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAudioMinimized(!audioMinimized)}
                      className="h-8 w-8 p-0"
                      title={audioMinimized ? "Maximize" : "Minimize"}
                    >
                      {audioMinimized ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {!audioMinimized && (
                <CardContent>
                  {audio ? (
                    <AudioPlayerSection 
                      audioContent={audio}
                      queryId={query.id}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-gray-400 text-sm">
                        Audio narration is being generated...
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card> */}

            {/* Video Player */}
            {/* <Card className={`${videoMinimized ? '' : 'flex-1'} transition-all`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    Video Explanation
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVideoMinimized(!videoMinimized)}
                    className="h-8 w-8 p-0"
                    title={videoMinimized ? "Maximize" : "Minimize"}
                  >
                    {videoMinimized ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {!videoMinimized && (
                <CardContent>
                  {video ? (
                    <VideoPlayer
                      videoUrl={videoData?.videoUrl}
                      status={videoData?.status || 'processing'}
                      title="Video Explanation"
                    />
                  ) : (
                    <div className="flex items-center justify-center py-12 bg-gray-100 rounded-lg">
                      <p className="text-gray-400 text-sm">
                        Video explanation will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card> */}
          </div>
        </div>

        {/* Quick Summary at Bottom */}
        {query.researchData && (
          <Card className={`mt-6 ${summaryMinimized ? '' : ''} transition-all`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Quick Summary</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSummaryMinimized(!summaryMinimized)}
                  className="h-8 w-8 p-0"
                  title={summaryMinimized ? "Maximize" : "Minimize"}
                >
                  {summaryMinimized ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {!summaryMinimized && (
              <CardContent>
                <p className="text-sm text-gray-700">
                  {query.researchData.summary}
                </p>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
