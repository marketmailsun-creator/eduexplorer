/**
 * Remove markdown formatting from text
 * Cleans up *, #, **, ___, etc. for display and audio generation
 */
export function cleanMarkdown(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove headers (# ## ###)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Remove bold (**text** or __text__)
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');

  // Remove italic (*text* or _text_)
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  cleaned = cleaned.replace(/_(.+?)_/g, '$1');

  // Remove strikethrough (~~text~~)
  cleaned = cleaned.replace(/~~(.+?)~~/g, '$1');

  // Remove inline code (`text`)
  cleaned = cleaned.replace(/`(.+?)`/g, '$1');

  // Remove code blocks (```text```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

  // Remove links [text](url) -> text
  cleaned = cleaned.replace(/\[(.+?)\]\(.+?\)/g, '$1');

  // Remove images ![alt](url)
  cleaned = cleaned.replace(/!\[.*?\]\(.+?\)/g, '');

  // Remove bullet points (-, *, +)
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '');

  // Remove numbered lists (1. 2. 3.)
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '');

  // Remove blockquotes (>)
  cleaned = cleaned.replace(/^>\s+/gm, '');

  // Remove horizontal rules (---, ***, ___)
  cleaned = cleaned.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '');

  // Clean up excessive line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Format text for display - preserves some structure but removes markdown
 */
export function formatForDisplay(text: string): string {
  if (!text) return '';

  let formatted = text;

  // Convert headers to plain text with line breaks
  formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, '\n$1\n');

  // Remove bold but keep text
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '$1');
  formatted = formatted.replace(/__(.+?)__/g, '$1');

  // Remove italic but keep text
  formatted = formatted.replace(/\*(.+?)\*/g, '$1');
  formatted = formatted.replace(/_(.+?)_/g, '$1');

  // Convert links to just the text
  formatted = formatted.replace(/\[(.+?)\]\(.+?\)/g, '$1');

  // Remove images
  formatted = formatted.replace(/!\[.*?\]\(.+?\)/g, '');

  // Keep bullet points but clean them up
  formatted = formatted.replace(/^[\s]*[-*+]\s+/gm, '• ');

  // Keep numbered lists but clean them up
  formatted = formatted.replace(/^[\s]*(\d+)\.\s+/gm, '$1. ');

  // Remove code blocks
  formatted = formatted.replace(/```[\s\S]*?```/g, '');

  // Remove inline code backticks
  formatted = formatted.replace(/`(.+?)`/g, '$1');

  // Remove blockquote markers
  formatted = formatted.replace(/^>\s+/gm, '');

  // Remove horizontal rules
  formatted = formatted.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '');

  // Clean up excessive line breaks
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  formatted = formatted.trim();

  return formatted;
}

/**
 * Format text specifically for audio/TTS
 * Removes all formatting and makes it flow naturally for speech
 */
export function formatForAudio(text: string): string {
  if (!text) return '';

  let audioText = cleanMarkdown(text);

  // Replace double line breaks with single for natural flow
  audioText = audioText.replace(/\n\n+/g, '. ');

  // Replace single line breaks with spaces
  audioText = audioText.replace(/\n/g, ' ');

  // Remove multiple spaces
  audioText = audioText.replace(/\s{2,}/g, ' ');

  // Remove any remaining special characters that might affect audio
  audioText = audioText.replace(/[*#_~`[\]]/g, '');

  // Clean up punctuation spacing
  audioText = audioText.replace(/\s+\./g, '.');
  audioText = audioText.replace(/\s+,/g, ',');
  audioText = audioText.replace(/\.\s*\./g, '.');

  // Ensure proper sentence spacing
  audioText = audioText.replace(/\.\s*/g, '. ');
  audioText = audioText.replace(/,\s*/g, ', ');

  // Trim and return
  return audioText.trim();
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Extract plain text summary from markdown content
 */
export function extractSummary(text: string, maxLength: number = 200): string {
  const cleaned = cleanMarkdown(text);
  return truncateText(cleaned, maxLength);
}
