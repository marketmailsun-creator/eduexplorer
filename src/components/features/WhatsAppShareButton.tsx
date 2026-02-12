'use client';
// ============================================================
// FILE 1: src/components/features/WhatsAppShareButton.tsx
// Add to results page header alongside ShareButton and SaveButton
// ============================================================

import { useState } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';

interface WhatsAppShareButtonProps {
  topic: string;
  summary?: string;    // First 300 chars of article text
  queryId: string;
}

export function WhatsAppShareButton({ topic, summary, queryId }: WhatsAppShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const appUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/results/${queryId}`
    : '';

  const shortSummary = summary
    ? summary.replace(/\n+/g, ' ').trim().slice(0, 280) + (summary.length > 280 ? '…' : '')
    : '';

  const whatsappText = [
    `📚 *${topic}*`,
    '',
    shortSummary ? shortSummary : '',
    '',
    `🔗 Full article + quiz + flashcards:`,
    appUrl,
    '',
    '_Shared via EduExplorer — AI-powered learning_',
  ].filter(Boolean).join('\n');

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] 
                   text-white text-sm font-semibold transition-colors shadow-sm"
        title="Share on WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#25D366] px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Share on WhatsApp</h3>
                <p className="text-green-100 text-xs">Send to friends or groups</p>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4">
              <div className="bg-[#f0fdf4] border border-green-200 rounded-xl p-3 mb-4 text-sm text-gray-700 leading-relaxed max-h-40 overflow-y-auto font-mono text-xs">
                {whatsappText}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp open */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl 
                             bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Open WhatsApp
                </a>

                {/* Copy text */}
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl 
                             border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="w-full mt-2 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}