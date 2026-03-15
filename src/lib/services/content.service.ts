import OpenAI from 'openai';
import { prisma } from '../db/prisma';
import { incrementUsageCounter, sendQuotaAlertOnce } from '../db/redis';

// Use Groq (OpenAI-compatible API)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_API_KEY ? new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
}) : null;

console.log('🔑 Content Service - Groq API:', GROQ_API_KEY ? '✅ SET' : '❌ MISSING');

async function generateArticleWithGroq(
  researchData: string,
  topic: string,
  learningLevel: string = 'college',
  sources: string[] = []
): Promise<string> {
  if (!groq) {
    throw new Error('GROQ_API_KEY not configured');
  }

  console.log('📝 Generating deep article with Groq (Llama 3.3 70B)...');

  const levelDepthGuidelines = {
    elementary: `Write for curious 10-12 year olds. Use simple language and short sentences. Explain every technical word. Use relatable everyday examples. Make it exciting and fun. Avoid jargon. Use analogies children can relate to.`,
    'high-school': `Write for teenagers (14-18). Balance clarity with academic rigor. Introduce technical vocabulary but always define it. Use real examples from science, history, or culture. Connect concepts to things they've studied. Include some mathematical or quantitative examples where relevant.`,
    college: `Write at undergraduate academic level. Use precise domain terminology. Demonstrate theoretical depth and nuance. Include quantitative reasoning where applicable. Reference methodologies and frameworks. Draw connections across disciplines. Cite the type of evidence that supports each claim.`,
    adult: `Write for working professionals. Connect theory directly to practical applications and career relevance. Use industry terminology correctly. Include case studies and real-world scenarios. Acknowledge complexity and trade-offs. Focus on actionable insights alongside conceptual understanding.`,
  };

  const systemPrompt = `You are a world-class educational author and subject matter expert writing a comprehensive, in-depth educational article for ${learningLevel} level learners.

${levelDepthGuidelines[learningLevel as keyof typeof levelDepthGuidelines] || levelDepthGuidelines.college}

Your writing standards:
- Every section must go beyond surface-level description into genuine analysis and explanation
- Use specific facts, figures, dates, names, and mechanisms — not vague generalities
- Explain the WHY behind concepts, not just the WHAT
- Connect ideas to their broader context and significance
- Write with intellectual depth while maintaining clarity appropriate to the level
- Structure content with clear headings and well-developed paragraphs
- Aim for completeness — a student should finish reading and feel they truly understand the topic`;

  const sourcesList = sources.length > 0
    ? `\n\nSources consulted:\n${sources.slice(0, 8).map((url, i) => `${i + 1}. ${url}`).join('\n')}`
    : '';

  const prompt = `You have the following research on "${topic}":

---
${researchData}
---
${sourcesList}

Write a comprehensive, in-depth educational article on "${topic}" for ${learningLevel} level learners.

Use the following 8-section structure. Each section must be substantive and detailed — aim for 200-400 words per section:

## 1. Introduction
Hook the reader with a compelling opening. State why this topic matters and what they will learn. Preview the key ideas.

## 2. Background & Historical Context
When and how did this concept/field/phenomenon emerge? Who are the key figures? What historical developments led to current understanding? What problem or question does this topic address?

## 3. Core Concepts & Theoretical Foundations
Explain the fundamental principles, theories, or mechanisms in detail. Define all key terms. Break down complex ideas step by step. Use precise language appropriate to the level.

## 4. In-Depth Analysis & Explanation
Go beyond the basics. Explain HOW and WHY things work the way they do. Cover the mechanisms, processes, or reasoning in depth. Address the nuances and subtleties that distinguish real understanding from surface knowledge.

## 5. Real-World Applications & Case Studies
Provide 3-4 concrete, specific real-world examples or case studies. Show how the concepts play out in practice. Include specific details — names, places, outcomes, numbers where relevant.

## 6. Common Misconceptions & Clarifications
What do people commonly misunderstand about this topic? Correct at least 2-3 common misconceptions. Explain why the misconception exists and what the correct understanding is.

## 7. Connections & Advanced Insights
How does this topic connect to related fields or concepts? What are the broader implications? What cutting-edge developments or open questions exist? What should a curious learner explore next?

## 8. Summary & Key Takeaways
Synthesize the most important points. List 5-7 specific, actionable key takeaways that capture the essence of deep understanding. End with a thought-provoking closing statement.

Write in a clear, authoritative voice. Be specific. Use examples. Demonstrate genuine depth of knowledge. Do not use placeholder text or say "as mentioned above" — each section should stand on its own merit.`;

  try {
    await incrementUsageCounter('groq');
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    });

    const article = response.choices[0].message.content || '';

    console.log(`✅ Article generated: ${article.length} characters`);
    return article;
  } catch (error: any) {
    console.error('❌ Groq article generation error:', error.message);
    await sendQuotaAlertOnce('groq', `Groq article generation failed.\nError: ${error.message}`);
    throw error;
  }
}

export async function generateContentForQuery(queryId: string) {
  const research = await prisma.researchData.findUnique({
    where: { queryId },
    include: { query: true },
  });

  if (!research) throw new Error('Research data not found');

  console.log(`📝 Generating content for query: ${queryId}`);

  // Use full research content (not just the 500-char summary)
  const fullResearchContent = (research.rawData as any)?.cleanedContent || research.summary;
  const sourceUrls: string[] = Array.isArray((research.rawData as any)?.citations)
    ? (research.rawData as any).citations
    : [];

  console.log(`📊 Research input: ${fullResearchContent.length} chars, ${sourceUrls.length} sources`);

  const article = await generateArticleWithGroq(
    fullResearchContent,
    research.query.queryText,
    research.query.complexityLevel || 'college',
    sourceUrls
  );

  const articleContent = await prisma.content.create({
    data: {
      queryId,
      contentType: 'article',
      title: research.query.queryText,
      data: { text: article },
    },
  });

  console.log(`✅ Article content created: ${articleContent.id}`);

  return articleContent;
}

// ── Document query topic extraction ───────────────────────────────────────────

/**
 * Extract a clean topic label from Gemini research content.
 * Takes the first meaningful sentence, stripping common "This document discusses..." prefixes.
 * Returns null if content is too short or generic.
 */
export function extractTopicFromResearchContent(cleanedContent: string): string | null {
  if (!cleanedContent || cleanedContent.length < 10) return null;

  const stripped = cleanedContent
    .slice(0, 400)
    .replace(/^(this document (discusses|covers|is about|explains|presents|contains)|the (document|content|provided (document|text)|following content) (discusses|covers|is about|explains|presents)|based on the (document|content|provided)[,\s]|please analyze and explain the following:?|analyzing and explaining:?)\s*/i, '')
    .trim();

  if (!stripped || stripped.length < 5) return null;

  // Extract first sentence
  const firstSentence = stripped.split(/(?<=[.!?])\s+|\n/)[0].trim();

  if (!firstSentence || firstSentence.length < 5) return null;
  if (firstSentence.length > 100) return stripped.slice(0, 80).trim() || null;
  // Reject all-caps (likely a heading artifact)
  if (firstSentence === firstSentence.toUpperCase()) return null;

  return firstSentence;
}

/**
 * For document (PDF/text) queries: generate Groq article from research data
 * AND extract a clean topic from the research content to set as topicDetected.
 * Mirrors generateContentFromImageAnalysis() for document attachments.
 */
export async function generateContentFromDocumentQuery(queryId: string): Promise<void> {
  const research = await prisma.researchData.findUnique({
    where: { queryId },
    include: { query: true },
  });

  if (!research) throw new Error('Research data not found');

  console.log(`📄 Generating document query content for: ${queryId}`);

  const fullResearchContent = (research.rawData as any)?.cleanedContent || research.summary;
  const sourceUrls: string[] = Array.isArray((research.rawData as any)?.citations)
    ? (research.rawData as any).citations
    : [];

  // 1. Extract a clean topic from the Gemini research response
  const extractedTopic = extractTopicFromResearchContent(fullResearchContent);
  const topicLabel = extractedTopic || 'Document Analysis';

  // 2. Update topicDetected with the clean label
  if (extractedTopic) {
    await prisma.query.update({
      where: { id: queryId },
      data: { topicDetected: extractedTopic },
    });
    console.log(`✅ topicDetected set to: ${extractedTopic}`);
  }

  // 3. Generate Groq article using clean topic as title
  console.log(`📊 Research input: ${fullResearchContent.length} chars, ${sourceUrls.length} sources`);

  const article = await generateArticleWithGroq(
    fullResearchContent,
    research.query.queryText,
    research.query.complexityLevel || 'college',
    sourceUrls
  );

  const articleContent = await prisma.content.create({
    data: {
      queryId,
      contentType: 'article',
      title: topicLabel,
      data: { text: article },
    },
  });

  console.log(`✅ Document query article created: ${articleContent.id}`);
}

// ── Image analysis hybrid parser ──────────────────────────────────────────────

interface ParsedAnalysis {
  subjectArea: string | null;
  formattedMarkdown: string;
}

interface AnalysisSubsection {
  title: string;
  content: string;
}

interface AnalysisSection {
  title: string;
  content: string;
  subsections?: AnalysisSubsection[];
}

interface AnalysisJSON {
  subject_area?: string;
  sections?: AnalysisSection[];
}

/**
 * Tier 1 — JSON extraction.
 * Gemini Vision is prompted to return JSON. Parse it and convert to ## / ### markdown.
 */
function tryJsonExtraction(text: string): ParsedAnalysis | null {
  try {
    let jsonText = text.trim();

    // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
    const fenceMatch = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    // Extract first { ... } block if there is surrounding text
    if (!jsonText.startsWith('{')) {
      const braceStart = jsonText.indexOf('{');
      const braceEnd = jsonText.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd !== -1) {
        jsonText = jsonText.slice(braceStart, braceEnd + 1);
      }
    }

    const parsed: AnalysisJSON = JSON.parse(jsonText);
    if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      return null;
    }

    const subjectArea = parsed.subject_area?.trim().slice(0, 120) || null;

    const lines: string[] = [];
    parsed.sections.forEach((section, idx) => {
      lines.push(`## ${idx + 1}. ${section.title}`);
      if (section.content?.trim()) {
        lines.push('');
        lines.push(section.content.trim());
      }
      if (section.subsections?.length) {
        section.subsections.forEach(sub => {
          lines.push('');
          lines.push(`### ${sub.title}`);
          if (sub.content?.trim()) {
            lines.push('');
            lines.push(sub.content.trim());
          }
        });
      }
      lines.push('');
    });

    const formattedMarkdown = lines.join('\n').trim();
    if (!formattedMarkdown) return null;

    console.log('✅ [Image Parser Tier 1] JSON extraction succeeded');
    return { subjectArea, formattedMarkdown };
  } catch {
    return null;
  }
}

/**
 * Tier 2 — Structural section parser (no regex).
 * Scans lines using startsWith and char codes to detect numbered/lettered section headers.
 */
function trySectionParser(text: string): ParsedAnalysis | null {
  const lines = text.split('\n');

  interface SectionBlock {
    num: number;
    title: string;
    contentLines: string[];
    subsections: Array<{ letter: string; title: string; contentLines: string[] }>;
  }

  const sections: SectionBlock[] = [];
  let currentSection: SectionBlock | null = null;
  let currentSubsection: { letter: string; title: string; contentLines: string[] } | null = null;
  let subjectArea: string | null = null;

  const cleanBold = (l: string) => l.replace(/\*\*/g, '').replace(/:\s*$/, '').trim();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect subject area by string search (no regex)
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('subject area')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const afterColon = line.slice(colonIdx + 1).replace(/\*\*/g, '').trim();
        if (afterColon.length > 2) subjectArea = afterColon.slice(0, 120);
      }
      continue;
    }

    // Strip leading ** for pattern detection
    const stripped = line.startsWith('**') ? line.slice(2) : line;
    const firstCode = stripped.charCodeAt(0);

    // Numbered main section: first char is digit 1–9, second char is '.'
    const isDigit = firstCode >= 49 && firstCode <= 57; // '1'–'9'
    if (isDigit && stripped.length > 2 && stripped[1] === '.') {
      if (currentSubsection && currentSection) currentSection.subsections.push(currentSubsection);
      if (currentSection) sections.push(currentSection);
      currentSubsection = null;
      const sectionNum = parseInt(stripped[0], 10);
      const title = cleanBold(stripped.slice(2));
      currentSection = { num: sectionNum, title, contentLines: [], subsections: [] };
      continue;
    }

    // Lettered subsection: first char is lowercase a–f, second char is '.'
    const isLetter = firstCode >= 97 && firstCode <= 102; // 'a'–'f'
    if (isLetter && stripped.length > 2 && stripped[1] === '.') {
      if (currentSubsection && currentSection) currentSection.subsections.push(currentSubsection);
      const letter = stripped[0];
      const title = cleanBold(stripped.slice(2));
      currentSubsection = { letter, title, contentLines: [] };
      continue;
    }

    // Content line — add to current subsection or section
    const cleanedLine = line.replace(/\*\*/g, '');
    if (currentSubsection) {
      currentSubsection.contentLines.push(cleanedLine);
    } else if (currentSection) {
      currentSection.contentLines.push(cleanedLine);
    }
  }

  // Flush last section
  if (currentSubsection && currentSection) currentSection.subsections.push(currentSubsection);
  if (currentSection) sections.push(currentSection);

  if (sections.length === 0) return null;

  const mdLines: string[] = [];
  sections.forEach(section => {
    mdLines.push(`## ${section.num}. ${section.title}`);
    if (section.contentLines.length > 0) {
      mdLines.push('');
      mdLines.push(section.contentLines.join('\n').trim());
    }
    section.subsections.forEach(sub => {
      mdLines.push('');
      mdLines.push(`### ${sub.title}`);
      if (sub.contentLines.length > 0) {
        mdLines.push('');
        mdLines.push(sub.contentLines.join('\n').trim());
      }
    });
    mdLines.push('');
  });

  const formattedMarkdown = mdLines.join('\n').trim();
  if (!formattedMarkdown) return null;

  console.log('✅ [Image Parser Tier 2] Section parser succeeded');
  return { subjectArea, formattedMarkdown };
}

/**
 * Tier 3 — Regex fallback.
 * Handles the standard free-form Gemini Vision output format (**N. Title:**).
 * Always returns a result (never null).
 */
function tryRegexFallback(text: string): ParsedAnalysis {
  // Subject area extraction
  let subjectArea: string | null = null;
  const saMatch = text.match(/\*\*\d+\.\s*Subject Area[^*]*\*\*[:\s]*([\s\S]*?)$/i);
  if (saMatch) {
    const raw = saMatch[1].trim();
    const saLines = raw
      .split('\n')
      .map((l: string) => l.replace(/^\s*[*-]\s*/, '').replace(/\*\*/g, '').trim())
      .filter((l: string) => l.length > 0);
    subjectArea = saLines[0]?.slice(0, 120).trim() || null;
  }

  // Format headings: strip Subject Area section, convert bold headings to ## / ###
  let formatted = text.replace(/\n?\*\*\d+\.\s*Subject Area[^*]*\*\*[\s\S]*$/i, '').trim();
  formatted = formatted.replace(
    /^\*\*(\d+)\.\s*([^*]+?)\s*[*:]*\*\*\s*:?\s*$/gm,
    (_m: string, num: string, title: string) => `## ${num}. ${title.trim()}`
  );
  formatted = formatted.replace(
    /^\*\*([a-z])\.\s*([^*]+?)\s*[*:]*\*\*\s*:?\s*$/gm,
    (_m: string, _l: string, title: string) => `### ${title.trim()}`
  );

  console.log('⚠️ [Image Parser Tier 3] Regex fallback used');
  return { subjectArea, formattedMarkdown: formatted };
}

/**
 * Hybrid parser for Gemini Vision analysis text.
 * Tier 1: JSON extraction (best case — Gemini returns structured JSON)
 * Tier 2: Section parser (structural line scanning, no regex)
 * Tier 3: Regex fallback (handles standard free-form Gemini Vision output)
 */
export function parseImageAnalysisHybrid(text: string): ParsedAnalysis {
  return tryJsonExtraction(text) ?? trySectionParser(text) ?? tryRegexFallback(text);
}

/**
 * For image queries: extract subject area and formatted analysis from Vision output (hybrid parser),
 * then store it as the article content.
 * The Vision model has the image and produces the step-by-step solution — use it directly.
 */
export async function generateContentFromImageAnalysis(
  queryId: string,
  analysisText: string
): Promise<void> {
  console.log(`📸 Generating image analysis content for query: ${queryId}`);

  // 1. Parse Vision analysis — extract subject area and formatted markdown
  const { subjectArea, formattedMarkdown } = parseImageAnalysisHybrid(analysisText);
  if (subjectArea) {
    await prisma.query.update({
      where: { id: queryId },
      data: { topicDetected: subjectArea },
    });
    console.log(`✅ topicDetected set to: ${subjectArea}`);
  }

  // 2. Store Vision analysis as article (Vision model has the image; Research model is text-only)
  const articleContent = await prisma.content.create({
    data: {
      queryId,
      contentType: 'article',
      title: subjectArea || 'Image Analysis',
      data: { text: formattedMarkdown },
    },
  });

  console.log(`✅ Image analysis article stored: ${articleContent.id}`);
}