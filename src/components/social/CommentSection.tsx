'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Send, ThumbsUp, Reply, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Comment {
  id: string;
  text: string;
  user: {
    name: string | null;
    image: string | null;
  };
  likes: number;
  createdAt: string;
  replies: Comment[];
  likedByCurrentUser?: boolean;
}

interface CommentSectionProps {
  sharedContentId: string;
}

export function CommentSection({ sharedContentId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [sharedContentId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments/${sharedContentId}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const postComment = async () => {
    if (!newComment.trim() || !session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/comments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharedContentId,
          text: newComment,
          parentId: replyTo,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const likeComment = async (commentId: string) => {
    try {
      const response = await fetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to like comment');
      }

      console.log('✅ Like toggled:', data);

      // Update local state
      setComments((prevComments) =>
        prevComments.map((comment: any) =>
          comment.id === commentId
            ? { ...comment, likes: data.likes, isLiked: data.liked }
            : comment
        )
      );
    } catch (error: any) {
      console.error('❌ Like error:', error);
      alert(error.message);
    }
    };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
    <div className={`${depth > 0 ? 'ml-8 sm:ml-12 mt-4' : 'mt-6'}`}>
      <div className="flex gap-3">
        <img
          src={comment.user.image || '/default-avatar.png'}
          alt={comment.user.name || 'User'}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="font-semibold text-sm mb-1 truncate">
              {comment.user.name || 'Anonymous'}
            </div>
            <p className="text-gray-700 text-sm sm:text-base break-words">
              {comment.text}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
            <button
              onClick={() => likeComment(comment.id)}
              disabled={!session}
              className={`flex items-center gap-1 hover:text-purple-600 transition-colors ${
                comment.likedByCurrentUser ? 'text-purple-600' : ''
              }`}
            >
              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{comment.likes}</span>
            </button>
            
            {session && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="flex items-center gap-1 hover:text-purple-600 transition-colors"
              >
                <Reply className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Reply</span>
              </button>
            )}
            
            <span className="text-xs text-gray-400">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          {comment.replies?.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discussion ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {session ? (
          <div className="mb-6">
            {replyTo && (
              <div className="mb-2 text-sm text-gray-600 flex items-center gap-2">
                Replying to comment
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-purple-600 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <img
                src={session.user?.image || '/default-avatar.png'}
                alt="You"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px] text-sm sm:text-base"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={postComment}
                    disabled={!newComment.trim() || loading}
                    size="sm"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600 mb-3 text-sm sm:text-base">
              Sign in to join the discussion
            </p>
            <Button asChild size="sm">
              <a href="/login">Sign In</a>
            </Button>
          </div>
        )}

        {loadingComments ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}

            {comments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">
                  No comments yet. Be the first to start a discussion!
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
