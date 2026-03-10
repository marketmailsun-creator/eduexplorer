'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, BookOpen, GraduationCap, Brain } from 'lucide-react';
import { ALL_CURRICULA, getSubjects, getChapters, type BoardType, type CurriculumChapter } from '@/lib/data/curriculum';

export function CurriculumSelector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [board, setBoard] = useState<BoardType>('CBSE');
  const [classNum, setClassNum] = useState<number | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<CurriculumChapter | null>(null);

  const curriculum = ALL_CURRICULA.find(c => c.board === board)!;
  const availableClasses = curriculum.classes.map(c => c.classNumber);
  const subjects = classNum ? getSubjects(board, classNum) : [];
  const chapters = classNum && subject ? getChapters(board, classNum, subject) : [];

  const resetBelow = (level: 'board' | 'class' | 'subject') => {
    if (level === 'board') { setClassNum(null); setSubject(null); setChapter(null); }
    if (level === 'class') { setSubject(null); setChapter(null); }
    if (level === 'subject') { setChapter(null); }
  };

  const exploreTopic = (topic: string) => {
    const classLabel = curriculum.classes.find(c => c.classNumber === classNum)?.label ?? `Class ${classNum}`;
    const query = `${board} ${classLabel} ${subject}: ${chapter!.name} — ${topic}`;
    router.push(`/explore?q=${encodeURIComponent(query)}`);
  };

  const exploreChapter = () => {
    if (!chapter || !classNum || !subject) return;
    const classLabel = curriculum.classes.find(c => c.classNumber === classNum)?.label ?? `Class ${classNum}`;
    const query = `${board} ${classLabel} ${subject}: ${chapter.name} — complete chapter overview`;
    router.push(`/explore?q=${encodeURIComponent(query)}`);
  };

  const exploreChapterQuiz = () => {
    if (!chapter || !classNum || !subject) return;
    const classLabel = curriculum.classes.find(c => c.classNumber === classNum)?.label ?? `Class ${classNum}`;
    const query = `${board} ${classLabel} ${subject}: ${chapter.name} — complete chapter overview`;
    router.push(`/explore?q=${encodeURIComponent(query)}&autoQuiz=1`);
  };

  return (
    <div className="w-full mb-4 sm:mb-6">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl text-left hover:from-orange-100 hover:to-amber-100 transition-colors group"
        type="button"
      >
        <div className="p-1.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
          <GraduationCap className="h-4 w-4 text-orange-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">Browse by Syllabus</p>
          <p className="text-xs text-gray-500">CBSE & ICSE · Classes 6–12 · Chapter-wise topics</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded picker */}
      {open && (
        <div className="mt-2 p-4 bg-white border border-orange-100 rounded-xl shadow-sm space-y-4">

          {/* Level 1: Board */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Board</p>
            <div className="flex gap-2">
              {(['CBSE', 'ICSE'] as BoardType[]).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => { setBoard(b); resetBelow('board'); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    board === b
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Level 2: Class */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Class</p>
            <div className="flex flex-wrap gap-2">
              {availableClasses.map(cls => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => { setClassNum(cls); resetBelow('class'); }}
                  className={`w-12 h-10 rounded-lg text-sm font-bold border transition-colors ${
                    classNum === cls
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Level 3: Subject */}
          {classNum && subjects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subject</p>
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => { setSubject(s.name); resetBelow('subject'); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      subject === s.name
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Level 4: Chapter */}
          {subject && chapters.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Chapter</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                {chapters.map((ch, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setChapter(ch)}
                    className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                      chapter?.name === ch.name
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    <span className="text-xs font-medium opacity-60 mr-1">{i + 1}.</span>
                    {ch.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Level 5: Topics */}
          {chapter && chapter.topics.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Topic in <span className="text-orange-600">{chapter.name}</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
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
              <div className="flex items-center gap-2 flex-wrap">
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
      )}
    </div>
  );
}
