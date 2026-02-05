/**
 * Remove citation markers [1][2][3] from text
 */
export function removeCitations(text: string): string {
  // Remove citation markers like [1], [2], [1][2][3], etc.
  return text.replace(/\[\d+\](\[\d+\])*/g, '');
}

/**
 * Clean article text for display and processing
 */
export function cleanArticleText(text: string): string {
  let cleaned = text;
  
  // 1. Remove citation markers [1][2][3]
  cleaned = cleaned.replace(/\[\d+\](\[\d+\])*/g, '');
  
  // 2. Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // 3. Fix spacing around punctuation
  cleaned = cleaned.replace(/\s+([.,!?;:])/g, '$1');
  
  // 4. Remove spaces before closing parentheses
  cleaned = cleaned.replace(/\s+\)/g, ')');
  
  // 5. Add space after punctuation if missing
  cleaned = cleaned.replace(/([.,!?;:])([A-Z])/g, '$1 $2');
  
  // 6. Trim and remove extra newlines
  cleaned = cleaned.trim().replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
}

/**
 * Clean text specifically for JSON safety (quiz generation, flashcards, etc.)
 */
export function cleanForJSON(text: string): string {
  let cleaned = cleanArticleText(text);
  
  // 1. Escape backslashes
  cleaned = cleaned.replace(/\\/g, '\\\\');
  
  // 2. Escape double quotes
  cleaned = cleaned.replace(/"/g, '\\"');
  
  // 3. Remove or escape special characters that break JSON
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // 4. Fix LaTeX expressions (common issue)
  // Replace \( with \\( and \) with \\)
  cleaned = cleaned.replace(/\\\(/g, '\\\\(');
  cleaned = cleaned.replace(/\\\)/g, '\\\\)');
  
  return cleaned;
}

/**
 * Clean text for display (removes citations, formats nicely)
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
 * Extract plain text without citations or formatting
 */
export function extractPlainText(text: string): string {
  let plain = text;
  
  // Remove citations
  plain = removeCitations(plain);
  
  // Remove markdown formatting
  plain = plain.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  plain = plain.replace(/\*(.*?)\*/g, '$1'); // Italic
  plain = plain.replace(/`(.*?)`/g, '$1'); // Code
  
  // Remove bullet points
  plain = plain.replace(/^[•\-\*]\s*/gm, '');
  
  // Clean whitespace
  plain = plain.replace(/\s+/g, ' ').trim();
  
  return plain;
}

/**
 * Truncate text to max length, preserving sentences
 */
export function truncateToSentences(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  // Find the last sentence boundary before maxLength
  const truncated = text.substring(0, maxLength);
  const lastPeriod = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? ')
  );
  
  if (lastPeriod > 0) {
    return truncated.substring(0, lastPeriod + 1);
  }
  
  // If no sentence boundary found, just truncate
  return truncated + '...';
}
