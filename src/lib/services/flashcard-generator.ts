import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../db/prisma';
import { Prisma } from '@prisma/client';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  category: 'definition' | 'concept' | 'fact' | 'process' | 'application';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FlashcardDeck {
  topic: string;
  level: string;
  totalCards: number;
  cards: Flashcard[];
}

/**
 * Generate flashcards from article content using Gemini
 */
export async function generateFlashcards(
  queryId: string,
  articleText: string,
  options: {
    cardCount?: number;
    level?: string;
  } = {}
): Promise<{ deckId: string; status: string }> {
  
  const { cardCount = 15, level = 'college' } = options;

  console.log('═══════════════════════════════════════════════');
  console.log('🎴 GENERATING FLASHCARDS');
  console.log('═══════════════════════════════════════════════');
  console.log(`Query ID: ${queryId}`);
  console.log(`Cards: ${cardCount}`);
  console.log(`Level: ${level}`);

  try {
    const query = await prisma.query.findUnique({ where: { id: queryId } });
    if (!query) throw new Error('Query not found');

    // Generate flashcards using Gemini
    const deck = await generateFlashcardDeck(
      query.queryText,
      articleText,
      cardCount,
      level
    );

    // Save to database
    const flashcardContent = await prisma.content.create({
      data: {
        queryId,
        contentType: 'flashcards',
        title: `${query.queryText} - Flashcards`,
        data: {
          status: 'completed',
          deck: (deck as unknown) as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
    });

    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Flashcards generated: ${deck.totalCards} cards`);
    console.log('═══════════════════════════════════════════════\n');

    return {
      deckId: flashcardContent.id,
      status: 'completed',
    };
  } catch (error: any) {
    console.error('❌ Flashcard generation failed:', error.message);
    throw error;
  }
}

/**
 * Generate flashcard deck using Gemini
 */
async function generateFlashcardDeck(
  topic: string,
  content: string,
  cardCount: number,
  level: string
): Promise<FlashcardDeck> {
  
  if (!genAI) {
    console.warn('⚠️ GOOGLE_API_KEY not configured, using fallback');
    return generateSmartFallbackFlashcards(topic, content, cardCount, level);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Create ${cardCount} educational flashcards about "${topic}" for ${level} level students.

Content to base flashcards on:
${content.substring(0, 4000)}

Create diverse question types:
- Definitions (What is X?)
- Concepts (Explain why...)
- Facts (When/Where/Who...)
- Processes (How does X work?)
- Applications (Give an example of...)

Rules:
- Questions: Clear, specific, one concept per card
- Answers: Concise (1-3 sentences max)
- Mix difficulty levels (easy, medium, hard)
- Cover all major topics in the content
- NO generic questions like "What is important to know about..."
- Make each question specific and unique

Return ONLY valid JSON:
{
  "topic": "${topic}",
  "level": "${level}",
  "totalCards": ${cardCount},
  "cards": [
    {
      "id": 1,
      "question": "What is photosynthesis?",
      "answer": "The process by which plants convert light energy into chemical energy stored in glucose.",
      "category": "definition",
      "difficulty": "easy"
    },
    {
      "id": 2,
      "question": "Why is photosynthesis important for life on Earth?",
      "answer": "It produces oxygen that most organisms need to breathe and forms the base of most food chains.",
      "category": "concept",
      "difficulty": "medium"
    },
    {
      "id": 3,
      "question": "Describe the process of the light-dependent reactions in photosynthesis.",
      "answer": "Light energy is captured by chlorophyll in the thylakoid membranes, splitting water molecules to produce ATP, NADPH, and oxygen.",
      "category": "process",
      "difficulty": "hard"
    }
  ]
}

Generate the flashcard deck now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found in Gemini response, using smart fallback');
      return generateSmartFallbackFlashcards(topic, content, cardCount, level);
    }

    const deck: FlashcardDeck = JSON.parse(jsonMatch[0]);
    
    console.log(`✅ Generated ${deck.totalCards} flashcards with Gemini`);
    deck.cards.forEach((card, idx) => {
      console.log(`  ${idx + 1}. [${card.difficulty}] ${card.question.substring(0, 50)}...`);
    });
    
    return deck;
  } catch (error: any) {
    console.error('❌ Gemini flashcard error:', error.message);
    console.log('⚠️ Using smart fallback flashcards');
    return generateSmartFallbackFlashcards(topic, content, cardCount, level);
  }
}

/**
 * IMPROVED Fallback: Generate intelligent flashcards from content structure
 */
function generateSmartFallbackFlashcards(
  topic: string,
  content: string,
  cardCount: number,
  level: string
): FlashcardDeck {
  
  console.log('📝 Generating smart fallback flashcards...');
  
  const cards: Flashcard[] = [];
  
  // Extract key information from content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
  
  // Question templates for different categories
  const templates = {
    definition: [
      { q: `What is ${topic}?`, category: 'definition' as const },
      { q: `Define ${topic}.`, category: 'definition' as const },
      { q: `What does ${topic} mean?`, category: 'definition' as const },
    ],
    concept: [
      { q: `Why is ${topic} important?`, category: 'concept' as const },
      { q: `How does ${topic} work?`, category: 'concept' as const },
      { q: `What is the purpose of ${topic}?`, category: 'concept' as const },
    ],
    fact: [
      { q: `What are the key components of ${topic}?`, category: 'fact' as const },
      { q: `List the main features of ${topic}.`, category: 'fact' as const },
      { q: `What are the characteristics of ${topic}?`, category: 'fact' as const },
    ],
  };

  // Card 1: Main definition (from first substantial sentence)
  if (sentences.length > 0) {
    cards.push({
      id: 1,
      question: templates.definition[0].q,
      answer: sentences[0].trim(),
      category: 'definition',
      difficulty: 'easy',
    });
  }

  // Card 2: Importance/Purpose
  if (sentences.length > 1) {
    cards.push({
      id: 2,
      question: templates.concept[0].q,
      answer: sentences[1].trim(),
      category: 'concept',
      difficulty: 'easy',
    });
  }

  // Card 3-5: Extract key facts from content
  let cardId = 3;
  for (let i = 2; i < Math.min(5, sentences.length); i++) {
    const sentence = sentences[i].trim();
    
    // Create specific question based on sentence content
    let question;
    if (sentence.toLowerCase().includes('because') || sentence.toLowerCase().includes('reason')) {
      question = `Explain: ${sentence.split(/because|reason/i)[0].trim()}?`;
    } else if (sentence.toLowerCase().includes('when') || sentence.toLowerCase().includes('where')) {
      question = `When or where does this occur: ${topic}?`;
    } else {
      // Extract key term from sentence
      const words = sentence.split(' ').filter(w => w.length > 5);
      const keyTerm = words[0] || topic;
      question = `What do you know about ${keyTerm.toLowerCase().replace(/[^a-z0-9\s]/g, '')}?`;
    }
    
    cards.push({
      id: cardId++,
      question,
      answer: sentence,
      category: 'fact',
      difficulty: i < 4 ? 'easy' : 'medium',
    });
  }

  // Card 6-10: Questions from paragraphs
  for (let i = 0; i < Math.min(5, paragraphs.length) && cardId <= cardCount; i++) {
    const para = paragraphs[i].trim();
    const firstSentence = para.split(/[.!?]/)[0].trim();
    
    cards.push({
      id: cardId++,
      question: `Explain one aspect of ${topic}.`,
      answer: firstSentence,
      category: 'concept',
      difficulty: 'medium',
    });
  }

  // Card 11+: More specific questions
  while (cardId <= cardCount && sentences.length > cards.length) {
    const sentence = sentences[cards.length].trim();
    
    cards.push({
      id: cardId++,
      question: `True or False: Explain this statement about ${topic}.`,
      answer: sentence,
      category: 'application',
      difficulty: cards.length > 10 ? 'hard' : 'medium',
    });
  }

  console.log(`✅ Generated ${cards.length} smart fallback flashcards`);
  
  return {
    topic,
    level,
    totalCards: cards.length,
    cards,
  };
}
