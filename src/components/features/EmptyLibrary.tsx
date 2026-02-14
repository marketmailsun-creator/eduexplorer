'use client';
// ============================================================
// FILE: src/components/features/EmptyLibrary.tsx
// Smart empty state for the Library page.
// Shows topic suggestions based on the user's onboarding subjects
// stored in UserPreferences. Topics are clickable and fire a search.
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Headphones, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface EmptyLibraryProps {
  userName?: string;
}

// Subject → curated topic suggestions map
const SUBJECT_TOPICS: Record<string, { label: string; emoji: string; topics: string[] }> = {
  tech: {
    label: 'Technology',
    emoji: '💻',
    topics: [
      'How does quantum computing work?',
      'Explain neural networks simply',
      'What is blockchain technology?',
      'How does the internet work?',
      'What is cloud computing?',
    ],
  },
  coding: {
    label: 'Coding & Dev',
    emoji: '⌨️',
    topics: [
      'How does recursion work in programming?',
      'Explain REST APIs for beginners',
      'What is object-oriented programming?',
      'How does Git version control work?',
      'What is the difference between SQL and NoSQL?',
    ],
  },
  science: {
    label: 'Science',
    emoji: '🔬',
    topics: [
      'How does CRISPR gene editing work?',
      'Explain the theory of relativity',
      'What causes climate change?',
      'How do vaccines work?',
      'What is dark matter?',
    ],
  },
  math: {
    label: 'Mathematics',
    emoji: '📐',
    topics: [
      'Explain calculus in simple terms',
      'What is the Fibonacci sequence?',
      'How does Bayesian probability work?',
      'What is linear algebra used for?',
      'Explain prime numbers and their importance',
    ],
  },
  history: {
    label: 'History',
    emoji: '📜',
    topics: [
      'What caused World War I?',
      'History of the Roman Empire',
      'How did the Industrial Revolution change society?',
      'What was the Cold War?',
      'History of the Silk Road trade route',
    ],
  },
  business: {
    label: 'Business',
    emoji: '💼',
    topics: [
      'Explain supply and demand economics',
      'What is venture capital?',
      'How does compound interest work?',
      'What is agile project management?',
      'Explain game theory in business',
    ],
  },
  finance: {
    label: 'Finance',
    emoji: '💰',
    topics: [
      'How does the stock market work?',
      'What is dollar-cost averaging?',
      'Explain index funds vs. mutual funds',
      'How does inflation affect savings?',
      'What is a credit score and how is it calculated?',
    ],
  },
  health: {
    label: 'Health & Biology',
    emoji: '🩺',
    topics: [
      'How does the immune system work?',
      'Explain the gut-brain connection',
      'What happens during sleep and why is it important?',
      'How do muscles grow after exercise?',
      'What is the endocrine system?',
    ],
  },
  arts: {
    label: 'Arts & Culture',
    emoji: '🎨',
    topics: [
      'History of the Renaissance art movement',
      'How does music theory work?',
      'What is postmodern art?',
      'History of cinema and film',
      'How does architecture influence society?',
    ],
  },
  environment: {
    label: 'Environment',
    emoji: '🌍',
    topics: [
      'How does carbon capture technology work?',
      'What is biodiversity and why does it matter?',
      'Explain renewable energy sources',
      'What causes ocean acidification?',
      'History of the environmental movement',
    ],
  },
  english: {
    label: 'Language',
    emoji: '📚',
    topics: [
      'How do languages evolve over time?',
      'What is the Sapir-Whorf hypothesis?',
      'History of the English language',
      'How to analyse literary themes',
      'What is linguistics?',
    ],
  },
  general: {
    label: 'General Knowledge',
    emoji: '💡',
    topics: [
      'How does GPS work?',
      'What is the scientific method?',
      'Explain how aeroplanes fly',
      'How does memory work in the brain?',
      'What is philosophy and its major branches?',
    ],
  },
};

// Default fallback topics (shown if no subjects are known)
const DEFAULT_TOPICS = [
  'How does quantum computing work?',
  'Explain machine learning basics',
  'What causes climate change?',
  'How does the stock market work?',
  'What is the theory of relativity?',
  'How do vaccines work?',
];

export function EmptyLibrary({ userName }: EmptyLibraryProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's onboarding subjects from preferences
  useEffect(() => {
    fetch('/api/user/onboarding-subjects')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.subjects?.length) setSubjects(data.subjects);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleTopicClick = (topic: string) => {
    router.push(`/explore?q=${encodeURIComponent(topic)}`);
  };

  const handleAudioClick = () => {
    router.push('/explore');
  };

  // Build suggestion groups from subjects
  const suggestionGroups = subjects
    .filter(s => SUBJECT_TOPICS[s])
    .slice(0, 2) // Show max 2 subject groups
    .map(s => ({ subjectId: s, ...SUBJECT_TOPICS[s] }));

  const firstName = userName ? userName.split(' ')[0] : null;

  return (
    <div className="space-y-6">
      {/* Hero empty state */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50
                      border border-indigo-100 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                        flex items-center justify-center shadow-lg">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Your library is empty{firstName ? `, ${firstName}` : ''}
        </h2>
        <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto leading-relaxed">
          Save topics after learning them and they'll appear here for quick revisit.
        </p>
        <button
          onClick={() => router.push('/explore')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-gradient-to-r from-indigo-600 to-purple-600
                     text-white text-sm font-semibold shadow-md
                     hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg
                     transition-all duration-200"
        >
          Start exploring
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Subject-based suggestions */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {/* Personalised groups (when subjects are known) */}
          {suggestionGroups.length > 0 ? (
            suggestionGroups.map(group => (
              <div key={group.subjectId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{group.emoji}</span>
                  <h3 className="text-sm font-bold text-gray-900">
                    You're interested in {group.label} — try these:
                  </h3>
                </div>
                <div className="space-y-2">
                  {group.topics.slice(0, 3).map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTopicClick(topic)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl
                                 bg-gray-50 hover:bg-indigo-50 border border-transparent
                                 hover:border-indigo-200 transition-all duration-150 group"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0
                                           group-hover:text-indigo-600 transition-colors" />
                      <span className="text-sm text-gray-700 group-hover:text-indigo-700
                                       transition-colors font-medium flex-1">
                        {topic}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-500
                                             group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            /* Fallback: generic popular topics */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-900">Popular topics to get you started</h3>
              </div>
              <div className="space-y-2">
                {DEFAULT_TOPICS.slice(0, 4).map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTopicClick(topic)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl
                               bg-gray-50 hover:bg-indigo-50 border border-transparent
                               hover:border-indigo-200 transition-all duration-150 group"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0
                                         group-hover:text-indigo-600 transition-colors" />
                    <span className="text-sm text-gray-700 group-hover:text-indigo-700
                                     transition-colors font-medium flex-1">
                      {topic}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-500
                                           group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* "Listen on the go" CTA */}
          <button
            onClick={handleAudioClick}
            className="w-full flex items-center gap-4 p-5 rounded-2xl
                       bg-gradient-to-r from-purple-600 to-pink-600 text-white
                       hover:from-purple-700 hover:to-pink-700
                       transition-all duration-200 shadow-md hover:shadow-lg group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0
                            group-hover:bg-white/30 transition-colors">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-sm">Listen on the go 🎧</p>
              <p className="text-purple-200 text-xs mt-0.5">
                Every topic generates an audio summary — learn while commuting
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-white/70 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>
        </>
      )}
    </div>
  );
}
