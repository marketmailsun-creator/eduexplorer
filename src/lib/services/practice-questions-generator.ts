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
}

/**
 * Generate practice questions from article
 */
export async function generatePracticeQuestions(
  topic: string,
  articleText: string,
  count: number = 10,
  level: string = 'college'
): Promise<PracticeQuiz> {

  const cleanedText = cleanForJSON(articleText);

  if (!genAI) {
    console.warn('⚠️ GOOGLE_API_KEY not set, using fallback');
    return generateFallbackQuestions(topic, articleText, count, level);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('❓ GENERATING PRACTICE QUESTIONS');
  console.log('═══════════════════════════════════════════════');
  console.log(`Topic: ${topic}`);
  console.log(`Count: ${count}`);
  console.log(`Level: ${level}`);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Create ${count} practice questions about "${topic}" for ${level} level students.

Content to base questions on:
${cleanedText.substring(0, 4000)}

Generate diverse question types:
- Multiple choice (4 options, 1 correct)
- True/False
- Short answer
- Fill in the blank

Mix difficulty levels: 40% easy, 40% medium, 20% hard

Return ONLY valid JSON:
{
  "topic": "${topic}",
  "level": "${level}",
  "totalQuestions": ${count},
  "questions": [
    {
      "id": 1,
      "question": "What is the main function of chlorophyll in photosynthesis?",
      "type": "multiple-choice",
      "difficulty": "easy",
      "options": ["Absorb light energy", "Store glucose", "Release oxygen", "Break down water"],
      "correctAnswer": "Absorb light energy",
      "explanation": "Chlorophyll absorbs light energy from the sun, which is the first step in photosynthesis.",
      "category": "concept"
    },
    {
      "id": 2,
      "question": "Photosynthesis only occurs during the day.",
      "type": "true-false",
      "difficulty": "easy",
      "correctAnswer": "True",
      "explanation": "Photosynthesis requires light energy, so it only occurs when light is available.",
      "category": "fact"
    },
    {
      "id": 3,
      "question": "The chemical equation for photosynthesis is ___ + 6H2O + light → C6H12O6 + 6O2",
      "type": "fill-blank",
      "difficulty": "medium",
      "correctAnswer": "6CO2",
      "explanation": "Six molecules of carbon dioxide are needed along with water and light to produce glucose and oxygen.",
      "category": "process"
    },
    {
      "id": 4,
      "question": "Explain the difference between light-dependent and light-independent reactions.",
      "type": "short-answer",
      "difficulty": "hard",
      "correctAnswer": "Light-dependent reactions occur in thylakoids and require light to produce ATP and NADPH. Light-independent reactions (Calvin cycle) occur in stroma and use ATP and NADPH to produce glucose.",
      "explanation": "These are the two main stages of photosynthesis with different locations and requirements.",
      "category": "process"
    }
  ]
}

Generate the questions now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found, using fallback');
      return generateFallbackQuestions(topic, articleText, count, level);
    }

    const quiz: PracticeQuiz = JSON.parse(jsonMatch[0]);
    
    console.log(`✅ Generated ${quiz.totalQuestions} practice questions`);
    quiz.questions.forEach((q, idx) => {
      console.log(`  ${idx + 1}. [${q.difficulty}] ${q.type}: ${q.question.substring(0, 50)}...`);
    });

    return quiz;
  } catch (error: any) {
    console.error('❌ Question generation error:', error.message);
    return generateFallbackQuestions(topic, articleText, count, level);
  }
}

/**
 * Fallback: Generate basic questions from content
 */
function generateFallbackQuestions(
  topic: string,
  content: string,
  count: number,
  level: string
): PracticeQuiz {
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
  const questions: PracticeQuestion[] = [];

  // Question 1: What is X?
  questions.push({
    id: 1,
    question: `What is ${topic}?`,
    type: 'short-answer',
    difficulty: 'easy',
    correctAnswer: sentences[0]?.trim() || `${topic} is the main subject of this content.`,
    explanation: 'This is the fundamental definition.',
    category: 'definition',
  });

  // Question 2: True/False
  if (sentences.length > 1) {
    questions.push({
      id: 2,
      question: `True or False: ${sentences[1]?.trim()}`,
      type: 'true-false',
      difficulty: 'easy',
      correctAnswer: 'True',
      explanation: 'This statement is directly from the content.',
      category: 'fact',
    });
  }

  // Question 3-5: Multiple choice from content
  for (let i = 0; i < 3 && sentences.length > i + 2; i++) {
    const sentence = sentences[i + 2].trim();
    const words = sentence.split(' ');
    const keyWord = words.find(w => w.length > 6) || topic;

    questions.push({
      id: i + 3,
      question: `What does the content say about ${keyWord.toLowerCase()}?`,
      type: 'multiple-choice',
      difficulty: i === 0 ? 'easy' : 'medium',
      options: [
        sentence.substring(0, 50),
        'This is not mentioned',
        'The opposite is true',
        'It is undefined',
      ],
      correctAnswer: sentence.substring(0, 50),
      explanation: 'This information is stated in the article.',
      category: 'fact',
    });
  }

  // Remaining questions
  while (questions.length < count && sentences.length > questions.length) {
    const sentence = sentences[questions.length].trim();
    
    questions.push({
      id: questions.length + 1,
      question: `Explain: ${sentence.substring(0, 60)}...`,
      type: 'short-answer',
      difficulty: questions.length > 7 ? 'hard' : 'medium',
      correctAnswer: sentence,
      explanation: 'Refer to the article for the complete explanation.',
      category: 'concept',
    });
  }

  console.log(`✅ Generated ${questions.length} fallback questions`);

  return {
    topic,
    level,
    totalQuestions: questions.length,
    questions,
  };
}
