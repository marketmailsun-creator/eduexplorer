'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Sparkles, BookOpen, GraduationCap } from 'lucide-react';

interface OnboardingFlowProps {
  userName?: string;
  onComplete: () => void;
}

const SUBJECTS = [
  { id: 'math', label: 'Mathematics', emoji: '📐' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'history', label: 'History', emoji: '📜' },
  { id: 'tech', label: 'Technology', emoji: '💻' },
  { id: 'english', label: 'English / Language', emoji: '📚' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'arts', label: 'Arts & Culture', emoji: '🎨' },
  { id: 'health', label: 'Health & Biology', emoji: '🩺' },
  { id: 'environment', label: 'Environment', emoji: '🌍' },
  { id: 'finance', label: 'Finance', emoji: '💰' },
  { id: 'coding', label: 'Coding / Dev', emoji: '⌨️' },
  { id: 'general', label: 'General Knowledge', emoji: '💡' },
];

const LEVELS = [
  { id: 'elementary', label: 'Elementary', sub: 'Simple language, lots of examples', emoji: '🌱' },
  { id: 'high-school', label: 'High School', sub: 'Clear with some technical terms', emoji: '📗' },
  { id: 'college', label: 'College / University', sub: 'Academic depth with citations', emoji: '🎓' },
  { id: 'adult', label: 'Professional', sub: 'Industry-focused, practical', emoji: '💼' },
];

export function OnboardingFlow({ userName, onComplete }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [level, setLevel] = useState('college');
  const [completing, setCompleting] = useState(false);

  const toggleSubject = (id: string) => {
    setSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const finish = async () => {
    setCompleting(true);
    try {
      // Save preferences
      await fetch('/api/user/onboarding-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects, learningLevel: level }),
      });
    } catch { /* silent */ }
    onComplete();
    setCompleting(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 24,
        width: '100%', maxWidth: 480,
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: '#f1f5f9' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            width: `${((step + 1) / 3) * 100}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div style={{ padding: '36px 28px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36,
            }}>🎓</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
              Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
            </h2>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
              EduExplorer turns any topic into a full lesson — articles, quizzes, flashcards, audio and more. Let's personalise it for you in 30 seconds.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
              {[['📖', 'Articles'], ['🎧', 'Audio'], ['🎴', 'Flashcards'], ['📊', 'Slides'], ['🧩', 'Quizzes'], ['🗺️', 'Mind Maps']].map(([e, l]) => (
                <div key={l} style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>{e}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontWeight: 600 }}>{l}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{
              width: '100%', padding: '14px 24px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 14, color: '#fff',
              fontSize: 16, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Let's Get Started <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 1 — Pick subjects */}
        {step === 1 && (
          <div style={{ padding: '28px 24px' }}>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 1 of 2</p>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>What do you want to learn?</h2>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Pick up to 5 subjects (you can change this later)</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24, maxHeight: 320, overflowY: 'auto' }}>
              {SUBJECTS.map(s => {
                const selected = subjects.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleSubject(s.id)} style={{
                    padding: '12px 14px', borderRadius: 12, border: `2px solid ${selected ? '#6366f1' : '#e2e8f0'}`,
                    background: selected ? '#eef2ff' : '#fafafa',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 20 }}>{s.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: selected ? '#4338ca' : '#374151' }}>{s.label}</span>
                    {selected && <Check size={14} style={{ marginLeft: 'auto', color: '#6366f1' }} />}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={{
                flex: '0 0 auto', padding: '13px 20px', borderRadius: 12,
                border: '2px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b',
              }}>Back</button>
              <button
                onClick={() => setStep(2)}
                disabled={subjects.length === 0}
                style={{
                  flex: 1, padding: '13px 20px', borderRadius: 12, border: 'none',
                  background: subjects.length === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: subjects.length === 0 ? '#94a3b8' : '#fff',
                  fontSize: 15, fontWeight: 700, cursor: subjects.length === 0 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Choose level */}
        {step === 2 && (
          <div style={{ padding: '28px 24px' }}>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 2 of 2</p>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>What's your learning level?</h2>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Content will be tailored to this level</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {LEVELS.map(l => {
                const selected = level === l.id;
                return (
                  <button key={l.id} onClick={() => setLevel(l.id)} style={{
                    padding: '14px 16px', borderRadius: 14,
                    border: `2px solid ${selected ? '#6366f1' : '#e2e8f0'}`,
                    background: selected ? '#eef2ff' : '#fafafa',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 24 }}>{l.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: selected ? '#4338ca' : '#111', fontSize: 14 }}>{l.label}</p>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>{l.sub}</p>
                    </div>
                    {selected && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{
                flex: '0 0 auto', padding: '13px 20px', borderRadius: 12,
                border: '2px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b',
              }}>Back</button>
              <button onClick={finish} disabled={completing} style={{
                flex: 1, padding: '13px 20px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {completing ? 'Saving…' : '🚀 Start Exploring!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
