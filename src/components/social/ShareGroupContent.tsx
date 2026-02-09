'use client';

import { useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ShareGroupContentProps {
  groupId: string;
}

export function ShareGroupContent({ groupId }: ShareGroupContentProps) {
  const [open, setOpen] = useState(false);
  const [contentId, setContentId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!contentId.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/groups/share-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, contentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to share content');
      }

      setContentId('');
      setOpen(false);
      window.location.reload(); // Refresh to show new content
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full gap-2">
        <Share2 className="h-4 w-4" />
        Share Content to Group
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Content</DialogTitle>
            <DialogDescription>
              Enter the content ID or URL you want to share with this group
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Content ID or Query ID
              </label>
              <input
                type="text"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                placeholder="e.g., clxxxxxxxx"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can find this in the URL of your learning materials
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleShare}
                disabled={!contentId.trim() || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  'Share'
                )}
              </Button>
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
