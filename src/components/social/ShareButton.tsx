'use client';

import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Users, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';


interface ShareButtonProps {
  queryId: string;
  contentId?: string;
  title?: string;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

export default function ShareButton({ queryId, contentId, title }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareType, setShareType] = useState<'public' | 'groups'>('public');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sharingToGroups, setSharingToGroups] = useState(false);
  const { toast } = useToast();

  // Fetch user's groups when dialog opens
  useEffect(() => {
    if (open && shareType === 'groups') {
      fetchGroups();
    }
  }, [open, shareType]);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups/my-groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const handleCreatePublicLink = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId,
          shareType: 'public',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link');
      }

      setShareToken(data.shareToken);
      toast({
        title: 'Share link created!',
        description: 'Copy the link to share your content',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareToGroups = async () => {
    if (selectedGroups.length === 0) {
      toast({
        title: 'No groups selected',
        description: 'Please select at least one group',
        variant: 'destructive',
      });
      return;
    }
    const showToast = (title: string, description?: string, variant: 'default' | 'destructive' = 'default') => {
      const toastEl = document.createElement('div');
      toastEl.className = `fixed bottom-4 right-4 z-[9999] p-4 rounded-lg shadow-lg ${
        variant === 'destructive' ? 'bg-red-500' : 'bg-green-500'
      } text-white max-w-md`;
      
      toastEl.style.animation = 'slideInFromBottom 0.3s ease-out';
      
      toastEl.innerHTML = `
        <div class="font-semibold">${title}</div>
        ${description ? `<div class="text-sm mt-1 opacity-90">${description}</div>` : ''}
      `;
      
      document.body.appendChild(toastEl);
      
      setTimeout(() => {
        toastEl.style.animation = 'slideOutToBottom 0.3s ease-in';
        setTimeout(() => toastEl.remove(), 300);
      }, 3000);
    };

    // Add CSS animations
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideOutToBottom {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    setSharingToGroups(true);
    try {
      const response = await fetch('/api/share/sel-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId,
          groupIds: selectedGroups,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share to groups');
      }

      // ✨ Handle different scenarios
      if (data.sharedCount === 0) {
      showToast(
        'Already Shared',
        `Content is already shared with the selected group${selectedGroups.length > 1 ? 's' : ''}`
      );
    } else if (data.sharedCount < data.totalGroups) {
      showToast(
        'Partially Shared',
        `Shared to ${data.sharedCount} new group${data.sharedCount > 1 ? 's' : ''}. Already shared with ${data.totalGroups - data.sharedCount}.`
      );
    } else {
      showToast(
        'Shared Successfully!',
        `Content shared to ${data.sharedCount} group${data.sharedCount > 1 ? 's' : ''}`
      );
    }

      // toast({
      //   title: 'Shared successfully!',
      //   description: `Shared to ${selectedGroups.length} group${selectedGroups.length > 1 ? 's' : ''}`,
      // });

      // Also create public link for sharing
      //await handleCreatePublicLink();
      
      setOpen(false);
      setSelectedGroups([]);
      setShareType('public');

      if (!shareToken && data.shareToken) {
        setShareToken(data.shareToken);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSharingToGroups(false);
    }
  };

  const handleCopy = async () => {
    if (!shareToken) return;

    const shareUrl = `${window.location.origin}/shared/${shareToken}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: 'Link copied!',
      description: 'Share link copied to clipboard',
    });
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleShare = async () => {
    if (shareType === 'public') {
      await handleCreatePublicLink();
    } else {
      await handleShareToGroups();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Learning Material</DialogTitle>
          <DialogDescription>
            Share your content with others via a link or directly to your study groups
          </DialogDescription>
        </DialogHeader>

        {/* Share Type Selector */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={shareType === 'public' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setShareType('public')}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Public Link
          </Button>
          <Button
            variant={shareType === 'groups' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setShareType('groups')}
          >
            <Users className="h-4 w-4 mr-2" />
            Share to Groups
          </Button>
        </div>

        {shareType === 'public' ? (
          // Public Link Section
          <div className="space-y-4">
            {shareToken ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/shared/${shareToken}`}
                    className="flex-1 px-3 py-2 text-sm border rounded-lg bg-gray-50"
                  />
                  <Button onClick={handleCopy} size="sm" variant="outline">
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Anyone with this link can view your shared content
                </p>
              </div>
            ) : (
              <Button
                onClick={handleCreatePublicLink}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating link...' : 'Generate Share Link'}
              </Button>
            )}
          </div>
        ) : (
          // Share to Groups Section
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  You're not a member of any groups yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = '/groups';
                  }}
                >
                  Browse Groups
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedGroups.includes(group.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleGroupSelection(group.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{group.name}</h4>
                          <p className="text-xs text-gray-500">
                            {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedGroups.includes(group.id)
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedGroups.includes(group.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-3">
                    {selectedGroups.length > 0
                      ? `${selectedGroups.length} group${selectedGroups.length > 1 ? 's' : ''} selected`
                      : 'Select groups to share with'}
                  </p>
                  <Button
                    onClick={handleShareToGroups}
                    disabled={selectedGroups.length === 0 || sharingToGroups}
                    className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                        border-2 transition-all duration-200 select-none focus:outline-none
                        active:scale-95 disabled:opacity-60
                        
                      `}
                  >
                    {sharingToGroups
                      ? 'Sharing...'
                      : `Share to ${selectedGroups.length || ''} Group${selectedGroups.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}