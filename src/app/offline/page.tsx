'use client';

import { useRouter } from 'next/navigation';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const router = useRouter();

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-xl">
            <WifiOff className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-gray-600 mb-8">
          It looks like you've lost your internet connection. 
          Don't worry, you can still access your cached content!
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRefresh}
            className="w-full h-12 text-base gap-2"
            size="lg"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full h-12 text-base gap-2"
            size="lg"
          >
            <Home className="h-5 w-5" />
            Go to Home
          </Button>
        </div>

        {/* Helpful Tips */}
        <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">
            💡 While You're Offline
          </h3>
          <ul className="text-xs sm:text-sm text-gray-600 space-y-1 text-left">
            <li>• Check your Wi-Fi or mobile data connection</li>
            <li>• Try moving to an area with better signal</li>
            <li>• Access your previously viewed content</li>
            <li>• Your work is automatically saved locally</li>
          </ul>
        </div>
      </div>
    </div>
  );
}