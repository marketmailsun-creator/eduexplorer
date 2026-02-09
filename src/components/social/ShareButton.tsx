'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ShareButtonProps {
  contentId: string;
  contentType?: 'query' | 'content';
  title?: string;
}

export function ShareButton({ contentId, contentType = 'query', title }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareType, setShareType] = useState<'public' | 'private' | 'friends'>('public');

  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          shareType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link');
      }

      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {contentType === 'query' ? 'Learning Materials' : 'Content'}</DialogTitle>
            <DialogDescription>
              {title && <div className="font-medium text-gray-900 mt-2">{title}</div>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Share Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Who can access?</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShareType('public')}
                  className={`p-3 border rounded-lg text-sm ${
                    shareType === 'public'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300'
                  }`}
                >
                  🌐 Public
                </button>
                <button
                  onClick={() => setShareType('friends')}
                  className={`p-3 border rounded-lg text-sm ${
                    shareType === 'friends'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300'
                  }`}
                >
                  👥 Friends
                </button>
                <button
                  onClick={() => setShareType('private')}
                  className={`p-3 border rounded-lg text-sm ${
                    shareType === 'private'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300'
                  }`}
                >
                  🔒 Private
                </button>
              </div>
            </div>

            {/* Generate Share Link */}
            {!shareUrl ? (
              <Button
                onClick={handleShare}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Share Link'
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg border break-all text-sm">
                  {shareUrl}
                </div>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}