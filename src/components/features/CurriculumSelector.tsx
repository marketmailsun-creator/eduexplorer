'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown, ChevronUp, BookOpen, GraduationCap, Brain } from 'lucide-react';
import { ALL_CURRICULA, getSubjects, getChapters, type BoardType, type CurriculumChapter } from '@/lib/data/curriculum';

type Step = 'board' | 'class' | 'subject' | 'chapter' | 'topics';

const STEP_ORDER: Step[] = ['board', 'class', 'subject', 'chapter', 'topics'];

export function CurriculumSelector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('board');
  const [board, setBoard] = useState<BoardType | null>(null);
  const [classNum, setClassNum] = useState<number | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<CurriculumChapter | null>(null);

  const curriculum = board ? ALL_CURRICULA.find(c => c.board === board) : null;
  const availableClasses = curriculum?.classes.map(c => c.classNumber) ?? [];
  const subjects = board && classNum ? getSubjects(board, classNum) : [];
  const chapters = board && classNum && subject ? getChapters(board, classNum, subject) : [];
  const classLabel = curriculum?.classes.find(c => c.classNumber === classNum)?.label ?? (classNum ? `Class ${classNum}` : '');

  // Navigate back one step without clearing the current step's selection
  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  // Selection handlers — advance step and reset downstream on change
  const selectBoard = (b: BoardType) => {
    if (b !== board) { setClassNum(null); setSubject(null); setChapter(null); }
    setBoard(b);
    setStep('class');
  };

  const selectClass = (cls: number) => {
    if (cls !== classNum) { setSubject(null); setChapter(null); }
    setClassNum(cls);
    setStep('subject');
  };

  const selectSubject = (s: string) => {
    if (s !== subject) { setChapter(null); }
    setSubject(s);
    setStep('chapter');
  };

  const selectChapter = (ch: CurriculumChapter) => {
    setChapter(ch);
    setStep('topics');
  };

  // Navigation to explore page ({ scroll: false } preserved)
  const exploreTopic = (topic: string) => {
    const query = `${board} ${classLabel} ${subject}: ${chapter!.name} — ${topic}`;
    router.push(`/explore?q=${encodeURIComponent(query)}&level=high-school`, { scroll: false });
  };

  const exploreChapter = () => {
    if (!chapter || !classNum || !subject) return;
    const query = `${board} ${classLabel} ${subject}: ${chapter.name} — complete chapter overview`;
    router.push(`/explore?q=${encodeURIComponent(query)}&level=high-school&autoSubmit=1`, { scroll: false });
  };

  const exploreChapterQuiz = () => {
    if (!chapter || !classNum || !subject) return;
    const query = `${board} ${classLabel} ${subject}: ${chapter.name} — complete chapter overview`;
    router.push(`/explore?q=${encodeURIComponent(query)}&level=high-school&autoQuiz=1`, { scroll: false });
  };

  // Build breadcrumb text for toggle button subtitle
  const breadcrumb = [board, classLabel || null, subject, chapter?.name]
    .filter(Boolean)
    .join(' › ');

  const currentStepIdx = STEP_ORDER.indexOf(step);

  const STEP_LABELS: Record<Step, string> = {
    board: 'Select Board',
    class: 'Select Class',
    subject: 'Select Subject',
    chapter: 'Select Chapter',
    topics: chapter?.name ?? 'Topics',
  };

  return (
    <div className="w-full mb-4 sm:mb-6">
      {/* ── Toggle button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl text-left hover:from-orange-100 hover:to-amber-100 transition-colors group"
        type="button"
      >
        <div className="p-1.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
          <GraduationCap className="h-4 w-4 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">Browse by Syllabus</p>
          <p className="text-xs text-gray-500 truncate">
            {open && breadcrumb ? breadcrumb : 'CBSE & ICSE · Classes 6–12 · Chapter-wise topics'}
          </p>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        }
      </button>

      {/* ── Wizard panel ── */}
      {open && (
        <div className="mt-2 bg-white border border-orange-100 rounded-xl shadow-sm overflow-hidden">

          {/* Step header: back + progress dots + step counter */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-orange-50 bg-gradient-to-r from-orange-50/60 to-amber-50/60">
            {/* Back button — hidden on step 1 but keeps layout width */}
            <div className="w-16 flex-shrink-0">
              {step !== 'board' && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-0.5 text-orange-600 hover:text-orange-800 text-xs font-semibold transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 flex-1 justify-center">
              {STEP_ORDER.map((s, i) => (
                <div
                  key={s}
                  className={`rounded-full transition-all duration-200 ${
                    i <= currentStepIdx
                      ? 'w-5 h-1.5 bg-orange-500'
                      : 'w-1.5 h-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Step counter */}
            <div className="w-16 flex-shrink-0 text-right">
              <span className="text-xs text-gray-400 font-medium">{currentStepIdx + 1}/5</span>
            </div>
          </div>

          {/* Step label */}
          <div className="px-4 pt-3 pb-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {STEP_LABELS[step]}
            </p>
          </div>

          {/* ── Step content ── */}
          <div className="px-4 pb-4 pt-2">

            {/* Step 1: Board */}
            {step === 'board' && (
              <div className="flex gap-3">
                {(['CBSE', 'ICSE'] as BoardType[]).map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => selectBoard(b)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      board === b
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    {b}
                    <p className={`text-xs font-normal mt-0.5 ${board === b ? 'text-orange-100' : 'text-gray-400'}`}>
                      {b === 'CBSE' ? 'Class 6–12' : 'Class 9–10'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Class */}
            {step === 'class' && (
              <div className="flex flex-wrap gap-2">
                {availableClasses.map(cls => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => selectClass(cls)}
                    className={`w-12 h-12 rounded-xl text-sm font-bold border-2 transition-colors ${
                      classNum === cls
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Subject */}
            {step === 'subject' && (
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(s => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => selectSubject(s.name)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                      subject === s.name
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{s.emoji}</span>
                    <span className="truncate text-xs">{s.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 4: Chapter */}
            {step === 'chapter' && (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {chapters.map((ch, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectChapter(ch)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm border-2 transition-colors ${
                      chapter?.name === ch.name
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    <span className="text-xs font-bold opacity-50 mr-1.5">{i + 1}.</span>
                    {ch.name}
                  </button>
                ))}
              </div>
            )}

            {/* Step 5: Topics + Actions */}
            {step === 'topics' && chapter && (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {chapter.topics.map(topic => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => exploreTopic(topic)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-orange-800 hover:from-orange-100 hover:to-amber-100 hover:border-orange-400 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={exploreChapter}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    Explore full chapter
                  </button>
                  <button
                    type="button"
                    onClick={exploreChapterQuiz}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Brain className="h-4 w-4" />
                    Practice Quiz
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
