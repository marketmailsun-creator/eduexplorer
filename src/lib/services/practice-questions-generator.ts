// ============================================================
// FILE: src/lib/services/practice-questions-generator.ts — REPLACE EXISTING
// Key changes:
//   • generateTopicQuiz() — generates questions from the TOPIC alone
//     (not from article text) so questions are broader & more random
//   • Accepts previousQuestions[] to explicitly exclude similar ones
//   • setNumber seed gives different angle each time ("Set 2: focus on
//     applications", "Set 3: focus on misconceptions" etc.)
//   • generatePracticeQuestions() kept for backwards compat
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { cleanForJSON } from '../utils/text-cleaning-utils';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

export interface PracticeQuestion {
  id: number;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'fill-blank';
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  category: string;
}

export interface PracticeQuiz {
  topic: string;
  level: string;
  totalQuestions: number;
  questions: PracticeQuestion[];
  setNumber?: number;
  generatedAt?: string;
}

// Different focus areas for each quiz set — keeps questions fresh
const SET_FOCUSES = [
  'core concepts, definitions, and fundamental principles',
  'real-world applications, examples, and practical uses',
  'common misconceptions, edge cases, and "why" questions',
  'historical context, development, and key figures or events',
  'comparisons, relationships between concepts, and synthesis',
  'critical thinking, analysis, and problem-solving scenarios',
];

/**
 * PRIMARY: Generate a quiz based purely on TOPIC (no article needed).
 * This produces diverse, non-repetitive questions across regenerations.
 */
export async function generateTopicQuiz(
  topic: string,
  count: number = 10,
  level: string = 'college',
  previousQuestions: string[] = [],
  setNumber: number = 1,
): Promise<PracticeQuiz> {

  if (!genAI) {
    console.warn('⚠️ GOOGLE_API_KEY not set, using fallback');
    return generateFallbackTopicQuestions(topic, count, level, setNumber);
  }

  const focusArea = SET_FOCUSES[(setNumber - 1) % SET_FOCUSES.length];
  const prevBlock = previousQuestions.length > 0
    ? `\n\nIMPORTANT - Do NOT generate questions similar to these already-asked questions:\n${previousQuestions.slice(-30).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : '';

  const prompt = `You are an expert educator creating a practice quiz (Set #${setNumber}) about "${topic}" for ${level}-level students.

This set should focus specifically on: ${focusArea}
${prevBlock}
Generate exactly ${count} fresh questions. Mix these types:
- multiple-choice (4 options, 1 correct) — 50%
- true-false — 20%
- fill-blank — 20%
- short-answer — 10%

Difficulty mix: 30% easy, 50% medium, 20% hard

Rules:
1. Questions must test UNDERSTANDING, not just recall
2. Make distractors plausible (not obviously wrong)
3. Cover different subtopics within "${topic}"
4. Do NOT repeat any question from the excluded list above

Return ONLY valid JSON (no markdown, no backticks):
{
  "topic": "${topic}",
  "level": "${level}",
  "setNumber": ${setNumber},
  "totalQuestions": ${count},
  "generatedAt": "${new Date().toISOString()}",
  "questions": [
    {
      "id": 1,
      "question": "...",
      "type": "multiple-choice",
      "difficulty": "medium",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Because...",
      "category": "concept"
    }
  ]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Strip markdown fences if present
    const cleaned = text.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const quiz: PracticeQuiz = JSON.parse(jsonMatch[0]);
    quiz.setNumber = setNumber;
    quiz.generatedAt = new Date().toISOString();

    console.log(`✅ Quiz Set ${setNumber}: ${quiz.questions.length} questions generated for "${topic}"`);
    return quiz;

  } catch (error: any) {
    console.error('❌ Quiz generation error:', error.message);
    return generateFallbackTopicQuestions(topic, count, level, setNumber);
  }
}

/**
 * FALLBACK: Generate reasonable questions from topic name alone
 * (used when AI is unavailable)
 */
function generateFallbackTopicQuestions(
  topic: string,
  count: number,
  level: string,
  setNumber: number,
): PracticeQuiz {
  const questions: PracticeQuestion[] = [];
  const baseTemplates = [
    { q: `What is the primary purpose of ${topic}?`, type: 'short-answer' as const, diff: 'easy' as const, cat: 'definition' },
    { q: `Which of the following best describes ${topic}?`, type: 'multiple-choice' as const, diff: 'easy' as const, cat: 'concept' },
    { q: `${topic} was developed primarily to solve real-world problems.`, type: 'true-false' as const, diff: 'easy' as const, cat: 'fact' },
    { q: `What are the key components that make up ${topic}?`, type: 'short-answer' as const, diff: 'medium' as const, cat: 'concept' },
    { q: `How does ${topic} differ from related approaches?`, type: 'short-answer' as const, diff: 'medium' as const, cat: 'comparison' },
    { q: `The main limitation of ${topic} is ___.`, type: 'fill-blank' as const, diff: 'medium' as const, cat: 'application' },
    { q: `In practice, ${topic} is most commonly used for ___.`, type: 'fill-blank' as const, diff: 'medium' as const, cat: 'application' },
    { q: `${topic} requires specialized knowledge to implement correctly.`, type: 'true-false' as const, diff: 'medium' as const, cat: 'fact' },
    { q: `What would happen if the core principle of ${topic} were removed?`, type: 'short-answer' as const, diff: 'hard' as const, cat: 'analysis' },
    { q: `How has ${topic} evolved over time?`, type: 'short-answer' as const, diff: 'hard' as const, cat: 'history' },
  ];

  const templateOffset = (setNumber - 1) * 3;
  for (let i = 0; i < Math.min(count, baseTemplates.length); i++) {
    const t = baseTemplates[(i + templateOffset) % baseTemplates.length];
    questions.push({
      id: i + 1,
      question: t.q,
      type: t.type,
      difficulty: t.diff,
      options: t.type === 'multiple-choice'
        ? [`Core aspect of ${topic}`, `Peripheral use of ${topic}`, 'Neither applies', 'Both apply']
        : undefined,
      correctAnswer: t.type === 'multiple-choice' ? `Core aspect of ${topic}`
        : t.type === 'true-false' ? 'True'
        : `This depends on the specific context of ${topic}.`,
      explanation: `This tests understanding of ${topic} from a ${t.cat} perspective.`,
      category: t.cat,
    });
  }

  return { topic, level, totalQuestions: questions.length, questions, setNumber, generatedAt: new Date().toISOString() };
}

/**
 * LEGACY: Original function kept for backward compatibility.
 * New code should use generateTopicQuiz() instead.
 */
export async function generatePracticeQuestions(
  topic: string,
  articleText: string,
  count: number = 10,
  level: string = 'college',
): Promise<PracticeQuiz> {
  // Delegate to topic-first generation (ignores articleText for better variety)
  return generateTopicQuiz(topic, count, level, [], 1);
}
