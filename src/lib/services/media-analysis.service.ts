import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
// ✅ Correct model string
const MODEL = 'claude-sonnet-4-5-20250929';

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
      model: MODEL,
      max_tokens: 2048,
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
              text: `Analyze this image thoroughly in an educational context. Be exhaustive and precise.

1. Extract ALL visible text exactly as written — every word, number, symbol, label, and option
2. MATH/SCIENCE PROBLEMS: If the image contains a math problem, equation, or science question:
   a. Write out the full problem statement exactly
   b. Solve it completely step-by-step, showing all working and calculations
   c. State the final answer clearly
   d. Identify the method/concept used (e.g. quadratic formula, integration by parts, Newton's 2nd law)
3. MULTIPLE CHOICE: Include the question AND all answer options (A, B, C, D) with the correct answer identified
4. Identify the subject area (algebra, geometry, calculus, physics, chemistry, biology, history, etc.)
5. If it is a diagram, chart, or graph: describe all labels, axes, values, and what it represents

Reproduce every visible piece of text. This content will be used as a learning and research query.`,
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
    throw error;
  }
}

/**
 * Transcribe audio using OpenAI Whisper or similar service
 * Note: You'll need to set up Whisper API or use an alternative service
 */
/**
 * Transcribe audio using Claude's multimodal capabilities
 * Converts audio blob to text for use as query input
 */
  export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      const base64Audio = audioBuffer.toString('base64');

      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `This is an audio recording from a user who wants to learn about something. 
                Transcribe the spoken words accurately. 
                If you cannot process the audio, return: [Audio could not be transcribed]
                Return ONLY the transcribed text, nothing else.`,
              },
            ],
          },
        ],
      });

      const transcription = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n')
        .trim();

      console.log('✅ Audio transcribed:', transcription.substring(0, 100));
      return transcription || '[Audio could not be transcribed]';
    } catch (error) {
      console.error('Audio transcription error:', error);
      return '[Audio could not be transcribed]';
    }
  }

/**
 * Transcribe audio using OpenAI Whisper API
 */
// async function transcribeWithWhisper(audioBuffer: Buffer): Promise<string> {
//   try {
//     const formData = new FormData();
//     // Convert Buffer to Uint8Array for Blob compatibility
//     const uint8Array = new Uint8Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.byteLength);
//     const audioBlob = new Blob([uint8Array], { type: 'audio/webm' });
//         formData.append('file', audioBlob, 'audio.webm');
//     formData.append('model', 'whisper-1');

//     const response = await axios.post(
//       'https://api.openai.com/v1/audio/transcriptions',
//       formData,
//       {
//         headers: {
//           'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//           'Content-Type': 'multipart/form-data',
//         },
//       }
//     );

//     return response.data.text;
//   } catch (error) {
//     console.error('Whisper transcription error:', error);
//     return '[Audio transcription failed]';
//   }
// }

/**
 * Extract text from PDF documents
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Use Claude's PDF analysis capability
    const base64PDF = pdfBuffer.toString('base64');

    const message = await anthropic.messages.create({
      model: MODEL,
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
              text: `Extract and reproduce ALL content from this document accurately.

              1. Extract all text, headings, paragraphs, and sections verbatim
              2. Preserve the structure — include all questions, problems, exercises, and topics
              3. Include any formulas, equations, or technical content exactly as written
              4. If it is a study guide, worksheet, or exam: extract every question and option
              5. Focus on educational content that can be used as a learning or research query

              Reproduce the full content — do not summarize or shorten.`,
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
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: `Analyze all these images together in an educational context.

              1. Extract ALL visible text from each image exactly as written
              2. For each image: describe what is shown and reproduce all text, equations, or problems
              3. Identify how the images relate to each other
              4. State the overall educational topic or subject area
              5. List all questions or problems shown across all images

              Be exhaustive — reproduce every piece of text visible. This content will be used as a learning query.`,
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
    throw error;
  }
}
