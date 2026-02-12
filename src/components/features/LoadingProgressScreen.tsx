'use client';
// ============================================================
// FILE: src/components/features/LoadingProgressScreen.tsx
// Drop-in overlay shown while API call is processing
// Usage: wrap your loading state in SplitLayoutExplore.tsx
// ============================================================

import { useEffect, useState } from 'react';

interface LoadingProgressScreenProps {
  query: string;
  hasMedia?: boolean;
}

const STEPS = [
  {
    emoji: '🔍',
    label: 'Researching your topic',
    sub: 'Scanning trusted web sources in real-time',
    duration: 5000,
    colorFrom: '#3b82f6',
    colorTo: '#06b6d4',
  },
  {
    emoji: '📝',
    label: 'Writing your article',
    sub: 'Crafting a clear explanation for your level',
    duration: 6000,
    colorFrom: '#8b5cf6',
    colorTo: '#a855f7',
  },
  {
    emoji: '🎨',
    label: 'Creating learning formats',
    sub: 'Building slides, flashcards, quiz & audio',
    duration: 6000,
    colorFrom: '#f59e0b',
    colorTo: '#ef4444',
  },
  {
    emoji: '✅',
    label: 'Almost ready',
    sub: 'Putting the finishing touches together',
    duration: 99999,
    colorFrom: '#10b981',
    colorTo: '#059669',
  },
];

const FUN_FACTS = [
  '💡 Your brain processes visuals 60,000× faster than text.',
  '📚 30 mins of active reading/day = ~20 books a year.',
  '🧠 Teaching a concept is the fastest way to truly learn it.',
  '⏱️ Spaced repetition cuts study time by up to 70%.',
  '🎯 Quizzes beat re-reading 3× for long-term retention.',
  '🌍 Over 1 billion people are learning something online right now.',
  '✍️ Writing notes by hand improves memory by 29% vs typing.',
  '😴 Sleep consolidates learning — review before bed works!',
];

export function LoadingProgressScreen({ query, hasMedia = false }: LoadingProgressScreenProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(2);
  const [factIdx, setFactIdx] = useState(0);
  const [factVisible, setFactVisible] = useState(true);
  const [dots, setDots] = useState('');

  // Step timer
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    let accumulated = 0;
    STEPS.forEach((s, i) => {
      if (i === STEPS.length - 1) return;
      accumulated += s.duration;
      timers.push(setTimeout(() => setStep(i + 1), accumulated));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // Smooth progress bar animation
  useEffect(() => {
    const totalMs = STEPS.slice(0, 3).reduce((a, s) => a + s.duration, 0);
    const elapsedMs = STEPS.slice(0, step).reduce((a, s) => a + s.duration, 0);
    const target = Math.min((elapsedMs / totalMs) * 90 + 4, 92);
    let raf: number;
    const tick = () => {
      setProgress(prev => {
        const delta = target - prev;
        if (Math.abs(delta) < 0.3) return target;
        return prev + delta * 0.04;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step]);

  // Rotating fun facts with fade
  useEffect(() => {
    const interval = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIdx(i => (i + 1) % FUN_FACTS.length);
        setFactVisible(true);
      }, 400);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  // Animated dots
  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 450);
    return () => clearInterval(i);
  }, []);

  const current = STEPS[step];
  const grad = `linear-gradient(135deg, ${current.colorFrom}, ${current.colorTo})`;
  const truncatedQuery = query.length > 55 ? query.slice(0, 55) + '…' : query;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.07,
        backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Glow orb */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: grad, filter: 'blur(80px)', opacity: 0.15,
        transition: 'background 1s ease',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440, margin: '0 24px' }}>
        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 28,
          padding: '32px 28px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        }}>

          {/* Topic chip */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              maxWidth: '100%',
            }}>
              {hasMedia && <span style={{ fontSize: 14 }}>📷</span>}
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>
                "{truncatedQuery}"
              </span>
            </div>
          </div>

          {/* Emoji icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 22,
              background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, boxShadow: `0 8px 32px ${current.colorFrom}60`,
              transition: 'background 0.8s ease, box-shadow 0.8s ease',
              animation: 'pulse 2s infinite',
            }}>
              {current.emoji}
            </div>
          </div>

          {/* Step label */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
              {current.label}{dots}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
              {current.sub}
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Processing</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: grad, borderRadius: 99,
                width: `${progress}%`, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Step bubbles */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 24 }}>
            {STEPS.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: idx < step ? 14 : 13, fontWeight: 700,
                  background: idx < step
                    ? 'rgba(255,255,255,0.9)'
                    : idx === step
                    ? grad
                    : 'rgba(255,255,255,0.1)',
                  color: idx < step ? '#1e1b4b' : idx === step ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: idx === step ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
                  transform: idx === step ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.5s ease',
                  boxShadow: idx === step ? `0 4px 16px ${current.colorFrom}80` : 'none',
                }}>
                  {idx < step ? '✓' : idx + 1}
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{
                    width: 28, height: 2, borderRadius: 99,
                    background: idx < step ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.5s ease',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Fun fact rotator */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '12px 16px', minHeight: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: 12.5, textAlign: 'center',
              margin: 0, lineHeight: 1.5,
              opacity: factVisible ? 1 : 0, transition: 'opacity 0.4s ease',
            }}>
              {FUN_FACTS[factIdx]}
            </p>
          </div>
        </div>

        {/* Mini step labels below card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          {STEPS.map((s, idx) => (
            <div key={idx} style={{
              background: idx === step
                ? 'rgba(255,255,255,0.12)'
                : idx < step
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.03)',
              border: idx === step ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
              borderRadius: 12, padding: '8px 4px', textAlign: 'center',
              transition: 'all 0.5s ease',
            }}>
              <div style={{ fontSize: 18 }}>{s.emoji}</div>
              <div style={{
                color: idx === step ? '#fff' : idx < step ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                fontSize: 11, marginTop: 3, fontWeight: idx === step ? 600 : 400,
                transition: 'color 0.5s ease',
              }}>
                {s.label.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
