'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, ArrowLeft, Download, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AudioPlayerSection } from './AudioPlayerSection';
import { VideoPlayerSection } from './VideoPlayerSection';

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

  return (
    <div className="p-6 w-full">
      <div className="max-w-7xl mx-auto w-full">
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
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-12rem)] w-full">
          {/* Left Side - Content and Sources */}
          <div className="flex flex-col gap-4 overflow-auto min-h-0">
            {/* Main Article */}
            <div className="bg-white rounded-2xl shadow-md p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Comprehensive Explanation</h3>
              </div>

              <div className="overflow-auto min-h-0">
                <div className="bg-gray-50 rounded-lg p-4 prose prose-slate max-w-none">
                  {articleData?.text ? (
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {articleData.text}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">
                      Content is being generated...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sources */}
            {query.researchData && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h4 className="font-medium text-gray-800">Sources &amp; References</h4>
                </div>
                <div className="max-h-[300px] overflow-auto space-y-3">
                  {(query.researchData.sources as any[])?.map((source, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-md p-3 border border-transparent hover:border-gray-200">
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
              </div>
            )}
          </div>

          {/* Right Side - Audio and Video Players */}
          <div className="flex flex-col gap-6 min-h-0">
            {/* Audio Player */}
            {audio ? (
              <div className="bg-white rounded-2xl shadow-md p-6 flex-1 flex flex-col">
                <h3 className="font-medium text-gray-700 mb-4">Audio Playback</h3>
                <div className="bg-gray-50 rounded-lg p-4 flex-1 overflow-auto">
                  <AudioPlayerSection
                    audioUrl={audio.storageUrl!}
                    title="Audio Narration"
                    autoPlay={false}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md p-6 flex-1 flex items-center">
                <div className="w-full bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">
                    Audio narration is being generated...
                  </p>
                </div>
              </div>
            )}

            {/* Video Player */}
            {video ? (
              <div className="bg-white rounded-2xl shadow-md p-6 flex-1 flex flex-col">
                <h3 className="font-medium text-gray-700 mb-4">Video Player</h3>
                <div className="bg-gray-50 rounded-lg p-4 flex-1 overflow-auto">
                  <VideoPlayerSection
                    videoUrl={videoData?.videoUrl}
                    status={videoData?.status || 'processing'}
                    title="Video Explanation"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md p-6 flex-1 flex items-center justify-center">
                <div className="w-full bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-400 text-sm">
                    Video explanation will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Summary at Bottom */}
        {query.researchData && (
          <div className="mt-6 bg-white rounded-2xl shadow-md p-6">
            <div className="mb-2">
              <h5 className="text-lg font-semibold text-gray-800">Quick Summary</h5>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-700">
                {query.researchData.summary}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SplitResultsView_bk({ query, article, audio, video }: SplitResultsViewProps) {
  const router = useRouter();
  const articleData = article?.data as any;
  const videoData = video?.data as any;

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
            <div >
              <h1 className="text-2xl font-bold text-gray-800">{query.queryText}</h1>
              <p className="text-sm text-gray-600">
                Level: {query.complexityLevel || 'College'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Side - Content and Sources */}
          <div className="flex flex-col gap-4 overflow-auto min-h-0">
            {/* Main Article */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Comprehensive Explanation
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto max-h-[500px]">
                <div className="prose prose-slate max-w-none">
                  {articleData?.text ? (
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {articleData.text}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">
                      Content is being generated...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sources */}
            {query.researchData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Sources & References
                  </CardTitle>
                </CardHeader>
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
              </Card>
            )}
          </div>

          {/* Right Side - Audio and Video Players */}
          <div className="flex flex-col gap-6 min-h-0">
            {/* Audio Player */}
            {audio ? (
              <div className="bg-white rounded-lg shadow-md p-6 flex-1">
                <h3 className="font-medium text-gray-700 mb-4">Audio Playback</h3>
                <AudioPlayerSection
                  audioUrl={audio.storageUrl!}
                  title="Audio Narration"
                  autoPlay={false}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 flex-1">
                <h3 className="font-medium text-gray-700 mb-4">Audio Playback</h3>
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-gray-400 text-sm">
                    Audio narration is being generated...
                  </p>
                </div>
              </div>
            )}

            {/* Video Player */}
            {video ? (
              <div className="bg-white rounded-lg shadow-md p-6 flex-1">
                <h3 className="font-medium text-gray-700 mb-4">Video Player</h3>
                <VideoPlayerSection
                  videoUrl={videoData?.videoUrl}
                  status={videoData?.status || 'processing'}
                  title="Video Explanation"
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 flex-1">
                <h3 className="font-medium text-gray-700 mb-4">Video Player</h3>
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                  <p className="text-gray-400 text-sm">
                    Video explanation will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Summary at Bottom */}
        {query.researchData && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {query.researchData.summary}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}