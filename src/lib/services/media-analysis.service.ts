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

Return your response as a valid JSON object with this exact structure:
{
  "subject_area": "The academic subject and specific topic (e.g. 'Mathematics: Geometry', 'Physics: Newton Laws', 'Chemistry: Organic Reactions')",
  "sections": [
    {
      "title": "Section heading",
      "content": "Section body text. Use \\n for line breaks within content.",
      "subsections": [
        { "title": "Subsection heading", "content": "Subsection body text" }
      ]
    }
  ]
}

For the sections array include:
1. "Extracted Text" section — reproduce ALL visible text from the image exactly as written (every word, number, symbol, label, option)
2. One section per problem or question, titled descriptively (e.g. "Analysis of Multiple-Choice Question", "Algebra Problem Solution")
   - For each problem include subsections: "Full Problem Statement", "Method/Concept Used", "Step-by-step Solution", "Final Answer"
   - For math/science: solve completely step-by-step showing all working
   - For multiple choice: include all options and identify the correct answer with explanation
3. If diagrams/charts/graphs are present: one "Diagram Description" section with labels, axes, and values

Return ONLY the JSON object — no text before or after it.`,
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

Return your response as a valid JSON object with this exact structure:
{
  "subject_area": "The overall academic subject and topic across all images",
  "sections": [
    {
      "title": "Section heading",
      "content": "Section body text. Use \\n for line breaks within content.",
      "subsections": [
        { "title": "Subsection heading", "content": "Subsection body text" }
      ]
    }
  ]
}

For the sections array include:
1. "Extracted Text" — all visible text from all images combined
2. One section per image or problem, titled descriptively
3. "Relationships Between Images" section if the images relate to each other or form a sequence
4. For math/science problems: include subsections for Full Problem Statement, Method/Concept Used, Step-by-step Solution, Final Answer

Return ONLY the JSON object — no text before or after it.`,
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
