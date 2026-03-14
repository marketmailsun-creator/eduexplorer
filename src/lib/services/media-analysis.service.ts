import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Analyze image using Gemini's vision capabilities
 */
export async function analyzeImageWithClaude(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const base64Image = imageBuffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType as string,
        },
      },
      {
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
    ]);

    const analysis = result.response.text();
    console.log('✅ Gemini image analyzed');
    return analysis;
  } catch (error) {
    console.error('Image analysis error:', error);
    throw error;
  }
}

/**
 * Transcribe audio — client-side SpeechRecognition handles transcription;
 * the transcript is already in the query field when this is called.
 */
export async function transcribeAudio(_audioBuffer: Buffer): Promise<string> {
  // Audio transcription is handled client-side via SpeechRecognition.
  // This function is kept for API compatibility but is not actively called.
  return '[Audio could not be transcribed]';
}

/**
 * Extract text from PDF documents using Gemini
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const base64PDF = pdfBuffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64PDF,
          mimeType: 'application/pdf',
        },
      },
      {
        text: `Extract and reproduce ALL content from this document accurately.

1. Extract all text, headings, paragraphs, and sections verbatim
2. Preserve the structure — include all questions, problems, exercises, and topics
3. Include any formulas, equations, or technical content exactly as written
4. If it is a study guide, worksheet, or exam: extract every question and option
5. Focus on educational content that can be used as a learning or research query

Reproduce the full content — do not summarize or shorten.`,
      },
    ]);

    const text = result.response.text();
    console.log('✅ Gemini PDF extracted');
    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return 'Unable to extract PDF text';
  }
}

/**
 * Analyze multiple images together for context using Gemini
 */
export async function analyzeMultipleImages(
  images: Array<{ buffer: Buffer; mimeType: string }>
): Promise<string> {
  try {
    const imageParts = images.map((img) => ({
      inlineData: {
        data: img.buffer.toString('base64'),
        mimeType: img.mimeType as string,
      },
    }));

    const result = await model.generateContent([
      ...imageParts,
      {
        text: `Analyze all these images together in an educational context.

1. Extract ALL visible text from each image exactly as written
2. For each image: describe what is shown and reproduce all text, equations, or problems
3. Identify how the images relate to each other
4. State the overall educational topic or subject area
5. List all questions or problems shown across all images

Be exhaustive — reproduce every piece of text visible. This content will be used as a learning query.`,
      },
    ]);

    const analysis = result.response.text();
    console.log('✅ Gemini multiple images analyzed');
    return analysis;
  } catch (error) {
    console.error('Multiple image analysis error:', error);
    throw error;
  }
}
