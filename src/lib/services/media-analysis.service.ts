import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Analyze image using Claude's vision capabilities
 */
export async function analyzeImageWithClaude(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const base64Image = imageBuffer.toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analyze this image in the context of an educational query. Describe:
1. What is shown in the image
2. Any text, diagrams, or equations visible
3. Key educational concepts or topics related to the image
4. Any questions or problems shown

Be concise but comprehensive.`,
            },
          ],
        },
      ],
    });

    const analysis = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    return analysis;
  } catch (error) {
    console.error('Image analysis error:', error);
    return 'Unable to analyze image';
  }
}

/**
 * Transcribe audio using OpenAI Whisper or similar service
 * Note: You'll need to set up Whisper API or use an alternative service
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  // Option 1: Use OpenAI Whisper API (if you have API key)
  if (process.env.OPENAI_API_KEY) {
    return await transcribeWithWhisper(audioBuffer);
  }

  // Option 2: Use Web Speech API transcription (client-side)
  // This is a fallback - implement client-side transcription
  console.warn('Audio transcription requires OpenAI API key');
  return '[Audio recording attached - transcription not available]';
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeWithWhisper(audioBuffer: Buffer): Promise<string> {
  try {
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.text;
  } catch (error) {
    console.error('Whisper transcription error:', error);
    return '[Audio transcription failed]';
  }
}

/**
 * Extract text from PDF documents
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Use Claude's PDF analysis capability
    const base64PDF = pdfBuffer.toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64PDF,
              },
            },
            {
              type: 'text',
              text: 'Extract the key information and text from this document. Focus on educational content, questions, problems, or topics discussed.',
            },
          ],
        },
      ],
    });

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return 'Unable to extract PDF text';
  }
}

/**
 * Analyze multiple images together for context
 */
export async function analyzeMultipleImages(
  images: Array<{ buffer: Buffer; mimeType: string }>
): Promise<string> {
  try {
    const imageContent = images.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.buffer.toString('base64'),
      },
    }));

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: `Analyze these related images in an educational context. Describe:
1. What each image shows
2. How they relate to each other
3. The overall educational topic or question they represent
4. Any text, diagrams, equations, or problems visible

Provide a comprehensive analysis.`,
            },
          ],
        },
      ],
    });

    const analysis = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    return analysis;
  } catch (error) {
    console.error('Multiple image analysis error:', error);
    return 'Unable to analyze images';
  }
}
